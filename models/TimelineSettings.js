const { Model } = require('objection');

class TimelineSettings extends Model {
    static get tableName() {
        return 'timeline_settings';
    }
}

module.exports = TimelineSettings;