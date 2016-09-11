module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone('SELECT * FROM experiment_model WHERE id = $1', id)
        },

        all: () => {
            return rep.any('SELECT * FROM experiment_model')
        },

        create: (t, experimentModelObj) => {
            return t.one(
                'insert into experiment_model (experiment, classification, generic_tag, hypothesis, independent_var, control_var, control_treatment, dependent_var, experimental_design, work_instructions) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
                [experimentModelObj.experiment, experimentModelObj.classification,experimentModelObj.generic_tag,experimentModelObj.hypothesis, experimentModelObj.independent_var, experimentModelObj.control_var, experimentModelObj.control_treatment, experimentModelObj.dependent_var,experimentModelObj.experimental_design,experimentModelObj.work_instructions], (id) =>  {return id})
        },

        update: (t, id, experimentModelObj) => {
            return t.one('UPDATE experiment_model SET experiment=$1, classification=$2 , generic_tag=$3, hypothesis=$4 ,independent_var=$5, control_var= $6, control_treatment=$7, dependent_var=$8 , experimental_design=$9 ,  work_instructions=$10 WHERE id=$11 RETURNING *',
                [experimentModelObj.experiment, experimentModelObj.classification,experimentModelObj.generic_tag,experimentModelObj.hypothesis,
                    experimentModelObj.independent_var, experimentModelObj.control_var, experimentModelObj.control_treatment, experimentModelObj.dependent_var,experimentModelObj.experimental_design,experimentModelObj.work_instructions, id], (expModel) => {return expModel})
        },

        'delete': (t, id) => {
            return t.one('delete from experiment_model where id=" + id + " RETURNING id')
        }
    }
}