const { Model } = require('objection');

class ProactiveRoadmap extends Model {
    static get tableName() {
        return 'unit_proactive_roadmap';
    }
}

module.exports = ProactiveRoadmap;