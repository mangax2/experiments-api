import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 54XXXX
class experimentDesignRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }
  
  @setErrorCode('540000')
  repository = () => this.rep

  @setErrorCode('541000')
  find = id => this.rep.oneOrNone('SELECT * FROM ref_experiment_design WHERE id=$1', id)

  @setErrorCode('542000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM ref_experiment_design WHERE id IN ($1:csv)', [ids])

  @setErrorCode('543000')
  all = () => this.rep.any('SELECT * FROM ref_experiment_design')

  @setErrorCode('544000')
  create = (t, experimentDesignObj, context) => t.one('INSERT INTO ref_experiment_design(name, created_user_id, created_date, modified_user_id, modified_date) VALUES($1, $2,CURRENT_TIMESTAMP, $2, CURRENT_TIMESTAMP) RETURNING id', [experimentDesignObj.name, context.userId])

  @setErrorCode('545000')
  update = (id, experimentDesignObj, context) => this.rep.oneOrNone('UPDATE ref_experiment_design SET (name, modified_user_id, modified_date) = ($1, $2, CURRENT_TIMESTAMP) WHERE id=$3 RETURNING *', [experimentDesignObj.name, context.userId, id])

  @setErrorCode('546000')
  delete = id => this.rep.oneOrNone('DELETE FROM ref_experiment_design WHERE id=$1 RETURNING id', id)

  @setErrorCode('547000')
  findByBusinessKey = keys => this.rep.oneOrNone('SELECT * FROM ref_experiment_design where name = $1', keys)

  @setErrorCode('548000')
  batchFindByBusinessKey = (batchKeys, tx = this.rep) => {
    const values = batchKeys.map(obj => ({
      name: obj.keys[0],
      id: obj.updateId,
    }))
    const query = `WITH d(name, id) AS (VALUES ${this.pgp.helpers.values(values, ['name', 'id'])}) select entity.name from public.ref_experiment_design entity inner join d on entity.name = d.name and (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  }
}

module.exports = (rep, pgp) => new experimentDesignRepo(rep, pgp)
