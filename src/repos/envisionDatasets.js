import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

const grouplistScript =
  "DROP TABLE IF EXISTS grouplist;" +
  "WITH RECURSIVE tree AS (" +
  "SELECT id, ARRAY[]::INTEGER[] AS ancestors " +
  "FROM public.group g WHERE g.experiment_id = $1 " +
  " UNION ALL " +
  "SELECT public.group.id, tree.ancestors || public.group.parent_id " +
  "FROM public.group, tree " +
  "WHERE public.group.parent_id = tree.id " +
  ") SELECT * INTO TEMP grouplist FROM tree;"

const locationsScript =
  "DROP TABLE IF EXISTS locations;" +
  "SELECT grouplist.id, gv.name, gv.value INTO TEMP locations " +
  "FROM grouplist, group_value gv " +
  "WHERE grouplist.ancestors = '{}' " +
  "AND gv.group_id = grouplist.id " +
  "AND gv.name = 'locationNumber';"

const treatmentToFactorLevelListScript =
  "DROP TABLE IF EXISTS treatmentToFactorLevelList;" +
  "SELECT id, jsonb_build_object('factor', name,'level', value) as factors " +
  "INTO TEMP treatmentToFactorLevelList " +
  "FROM ( " +
    "SELECT t.id, f.name, fl.value " +
    "FROM treatment t, combination_element c, factor_level fl, factor f " +
    "WHERE t.experiment_id = $1 " +
    "AND c.treatment_id = t.id " +
    "AND c.factor_level_id = fl.id " +
    "AND f.id = fl.factor_id " +
  ") s " +
  "group by id, name, value;"

const treatmentToFactorLevelArrayScript =
  "DROP TABLE IF EXISTS treatmentToFactorLevelArray;" +
  "SELECT id, array_agg(factors) AS factors " +
  "INTO TEMP treatmentToFactorLevelArray " +
  "FROM treatmentToFactorLevelList as tab " +
  "group by id " +
  "order by id;"

const putDataTogetherScript =
  "SELECT e.id as experiment_id, e.name, e.description, " +
  "e.status, e.is_template, e.capacity_request_sync_date, " +
  "u.id as unit_id, l.value AS location, u.rep, u.set_entry_id, " +
  "t.notes, t.is_control, " +
  "tfla.factors, " +
  "u.created_user_id, u.created_date, " +
  "u.modified_user_id, u.modified_date " +
  "FROM experiment e INNER JOIN treatment t ON e.id = t.experiment_id " +
  "INNER JOIN unit u ON u.treatment_id = t.id " +
  "INNER JOIN treatmentToFactorLevelArray tfla ON tfla.id = u.treatment_id " +
  "INNER JOIN grouplist gl ON u.group_id = gl.id " +
  "INNER JOIN locations l ON gl.ancestors[1] = l.id;"

// Error Codes 5NXXXX
class envisionDatasetsRepo {
  constructor(rep) {
    this.rep = rep
  }

  @setErrorCode('5N0000')
  repository = () => this.rep

  @setErrorCode('5N1000')
  getDataForEnvisionDatasets = function(experimentId, context, tx = this.rep){ return tx.any(
    grouplistScript +
    locationsScript +
    treatmentToFactorLevelListScript +
    treatmentToFactorLevelArrayScript +
    putDataTogetherScript,
    [experimentId],
  )
  }
}

module.exports = (rep) => new envisionDatasetsRepo(rep)
