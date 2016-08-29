module.exports = (rep, pgp) =>
  repository:()=> rep

  find: (id) => rep.oneOrNone('SELECT * FROM experiment_model WHERE id = $1', id)

  all: () => rep.any('SELECT * FROM experiment_model')

  create: (t, experimentModelObj) =>
    t.one("insert into experiment_model (experiment, classification, generic_tag, hypothesis, independent_var, dependent_var, observation, experimental_design, work_instructions)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",[experimentModelObj.experiment, experimentModelObj.classification,experimentModelObj.generic_tag,experimentModelObj.hypothesis,
      experimentModelObj.independent_var,experimentModelObj.dependent_var,experimentModelObj.observation,experimentModelObj.experimental_design,experimentModelObj.work_instructions], (id) ->  id)

  update: (t, id, experimentModelObj) =>
    t.one("UPDATE experiment_model SET experiment=$1, classification=$2 , generic_tag=$3, hypothesis=$4 ,independent_var=$5, dependent_var=$6 , observation=$7, experimental_design=$8 ,  work_instructions=$9 WHERE id=$10 RETURNING *",
      [experimentModelObj.experiment, experimentModelObj.classification,experimentModelObj.generic_tag,experimentModelObj.hypothesis,
      experimentModelObj.independent_var,experimentModelObj.dependent_var,experimentModelObj.observation,experimentModelObj.experimental_design,experimentModelObj.work_instructions, id], (expModel) -> expModel)


  delete: (t, id) =>
    t.one("delete from experiment_model where id=#{id} RETURNING id")