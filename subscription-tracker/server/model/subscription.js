const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        tier: {
            type: String,
            default: 'Standard',
            trim: true,
        },
        monthlyCost: {
            type: Number,
            required: true,
            min: 0,
        },
        billingCycleMonths: {
            type: Number,
            default: 1,
            min: 1,
        },
        category: {
            type: String,
            default: 'General',
            trim: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
