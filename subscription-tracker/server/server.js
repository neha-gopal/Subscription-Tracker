require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const dbclient = require('./dbclient');
const User = require('./model/user');
const Subscription = require('./model/subscription');

const app = express();
const PORT = process.env.PORT || 22452;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'development-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
        },
    })
);

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(__dirname));

function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'You must sign in first.' });
    }
    next();
}

function getNoticeDate(startDate, billingCycleMonths) {
    const nextCharge = new Date(startDate);
    nextCharge.setMonth(nextCharge.getMonth() + billingCycleMonths);
    nextCharge.setDate(nextCharge.getDate() - 3);
    return nextCharge;
}

app.get('/', (req, res) => {
    res.redirect('/main');
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'mainScreen.html'));
});

app.get('/subscriptions', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'subscriptions.html'));
});

app.get('/statistics', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'statistics.html'));
});

app.get('/mainScreen.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'mainScreen.js'));
});

app.get('/subscriptions.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'subscriptions.js'));
});

app.get('/statistics.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'statistics.js'));
});

app.get('/mainScreen.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'css', 'mainScreen.css'));
});

app.get('/subscriptions.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'css', 'subscriptions.css'));
});

app.get('/statistics.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'css', 'statistics.css'));
});

app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required.' });
        }

        const existingUser = await User.findOne({
            $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }],
        });

        if (existingUser) {
            return res.status(409).json({ error: 'That username or email is already in use.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
        });

        req.session.userId = user._id.toString();
        req.session.username = user.username;

        res.status(201).json({ message: 'Account created.', username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to create account right now.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const user = await User.findOne({ username: username.trim() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        req.session.userId = user._id.toString();
        req.session.username = user.username;

        res.json({ message: 'Signed in successfully.', username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to sign in right now.' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ message: 'Signed out.' });
    });
});

app.get('/api/me', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ authenticated: false });
    }

    const user = await User.findById(req.session.userId).select('username email');
    if (!user) {
        return res.json({ authenticated: false });
    }

    res.json({ authenticated: true, user });
});

app.get('/api/subscriptions', requireAuth, async (req, res) => {
    const subscriptions = await Subscription.find({ user: req.session.userId }).sort({ createdAt: -1 });
    res.json(subscriptions);
});

app.post('/api/subscriptions', requireAuth, async (req, res) => {
    try {
        const { name, tier, monthlyCost, billingCycleMonths, category, startDate } = req.body;

        if (!name || monthlyCost === undefined || monthlyCost === null || monthlyCost === '') {
            return res.status(400).json({ error: 'Subscription name and monthly cost are required.' });
        }

        const subscription = await Subscription.create({
            user: req.session.userId,
            name: String(name).trim(),
            tier: tier ? String(tier).trim() : 'Standard',
            monthlyCost: Number(monthlyCost),
            billingCycleMonths: Number(billingCycleMonths || 1),
            category: category ? String(category).trim() : 'General',
            startDate: startDate ? new Date(startDate) : new Date(),
        });

        res.status(201).json(subscription);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to save subscription right now.' });
    }
});

app.delete('/api/subscriptions/:id', requireAuth, async (req, res) => {
    const deleted = await Subscription.findOneAndDelete({
        _id: req.params.id,
        user: req.session.userId,
    });

    if (!deleted) {
        return res.status(404).json({ error: 'Subscription not found.' });
    }

    res.json({ message: 'Subscription deleted.' });
});

app.get('/api/statistics', requireAuth, async (req, res) => {
    const subscriptions = await Subscription.find({ user: req.session.userId }).sort({ createdAt: -1 });

    const enriched = subscriptions.map((subscription) => ({
        id: subscription._id,
        name: subscription.name,
        tier: subscription.tier,
        monthlyCost: subscription.monthlyCost,
        yearlyCost: subscription.monthlyCost * 12,
        billingCycleMonths: subscription.billingCycleMonths,
        startDate: subscription.startDate,
        noticeDate: getNoticeDate(subscription.startDate, subscription.billingCycleMonths),
    }));

    const totalMonthly = enriched.reduce((sum, subscription) => sum + subscription.monthlyCost, 0);
    const totalYearly = enriched.reduce((sum, subscription) => sum + subscription.yearlyCost, 0);

    res.json({
        count: enriched.length,
        totalMonthly,
        totalYearly,
        subscriptions: enriched,
    });
});

(async function startServer() {
    try {
        await dbclient.connect();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
})();
