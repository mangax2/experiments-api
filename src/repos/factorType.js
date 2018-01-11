import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5AXXXX
class factorTypeRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5A0000')
  repository = () => this.rep

  @setErrorCode('5A1000')
  find = (id, tx = this.rep) => tx.oneOrNone('SELECT * FROM ref_factor_type WHERE id = $1', id)

  @setErrorCode('5A2000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM ref_factor_type WHERE id IN ($1:csv)', [ids])

  @setErrorCode('5A3000')
  all = () => this.rep.any('SELECT * FROM ref_factor_type')

  @setErrorCode('5A4000')
  create = (t, factorTypeObj, context) => t.one('INSERT into ref_factor_type(type, created_user_id, created_date, modified_user_id, modified_date) values($1, $2, CURRENT_TIMESTAMP, $2, CURRENT_TIMESTAMP) RETURNING id', [factorTypeObj.type, context.userId])

  @setErrorCode('5A5000')
  update = (t, id, factorTypeObj, context) => t.oneOrNone('UPDATE ref_factor_type SET type=$1, modified_user_id=$2, modified_date=CURRENT_TIMESTAMP WHERE id=$3 RETURNING *', [factorTypeObj.type, context.userId, id])

  @setErrorCode('5A6000')
  delete = (t, id) => t.oneOrNone('DELETE from ref_factor_type where id=$1 RETURNING id', id)

  @setErrorCode('5A7000')
  findByBusinessKey = keys => this.rep.oneOrNone('SELECT * FROM ref_factor_type where type = $1', keys)

  @setErrorCode('5A8000')
  batchFindByBusinessKey = (batchKeys, tx = this.rep) => {
    const values = batchKeys.map(obj => ({
      type: obj.keys[0],
      id: obj.updateId,
    }))
    const query = `WITH d(type, id) AS (VALUES ${this.pgp.helpers.values(values, ['type', 'id'])}) select entity.type from public.ref_factor_type entity inner join d on entity.type = d.type and (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  }
}

module.exports = (rep, pgp) => new factorTypeRepo(rep, pgp)
