import PremiumAction from '../models/PremiumAction.js';
import PremiumLimit from '../models/PremiumLimit.js';
import User from '../models/User.js';

export async function getRoleLimits(role) {
  const limits = await PremiumLimit.find({ role: role.toUpperCase() });
  if (!limits || limits.length === 0) return null;

  const result = {
    profile_analysis: { days_between_analysis: 0, monthly_limit: 0 },
    post_optimization: { max_per_post: 0, monthly_limit: 0 },
    batch_analysis: { monthly_limit: 0 },
  };

  limits.forEach(limit => {
    if (limit.action_type === 'profile_analysis') {
      if (limit.limit_type === 'days_between_analysis') result.profile_analysis.days_between_analysis = limit.limit_value;
      else if (limit.limit_type === 'monthly_limit') result.profile_analysis.monthly_limit = limit.limit_value;
    } else if (limit.action_type === 'post_optimization') {
      if (limit.limit_type === 'max_per_post') result.post_optimization.max_per_post = limit.limit_value;
      else if (limit.limit_type === 'monthly_limit') result.post_optimization.monthly_limit = limit.limit_value;
    } else if (limit.action_type === 'batch_analysis') {
      if (limit.limit_type === 'monthly_limit') result.batch_analysis.monthly_limit = limit.limit_value;
    }
  });

  return result;
}

export async function getMonthlyActions(userId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const actions = await PremiumAction.aggregate([
    {
      $match: {
        user_id: userId,
        createdAt: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: '$action_type',
        count: { $sum: 1 },
      },
    },
  ]);

  return actions.map(a => ({ action_type: a._id, count: a.count }));
}

export async function getCurrentCycleActions(userId, subscriptionStartDate) {
  const startDate = new Date(subscriptionStartDate);
  const now = new Date();

  // Calculate the current cycle start based on subscription start date
  let cycleStart = new Date(startDate);
  while (cycleStart <= now) {
    const nextCycle = new Date(cycleStart);
    nextCycle.setMonth(nextCycle.getMonth() + 1);
    if (nextCycle > now) break;
    cycleStart = nextCycle;
  }

  const actions = await PremiumAction.aggregate([
    {
      $match: {
        user_id: userId,
        createdAt: { $gte: cycleStart },
      },
    },
    {
      $group: {
        _id: '$action_type',
        count: { $sum: 1 },
      },
    },
  ]);

  return actions.map(a => ({ action_type: a._id, count: a.count }));
}
