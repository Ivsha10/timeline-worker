const { Model } = require('objection');

class Unit extends Model {
    static get tableName() {
        return 'manage_unit';
    }


}

module.exports = Unit;