const { Model } = require('objection');

class ScheduledStep extends Model {
    static get tableName() {
        return 'scheduled_steps';
    }
}

module.exports = ScheduledStep;