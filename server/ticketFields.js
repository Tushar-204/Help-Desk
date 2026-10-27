const EMPLOYEE_CREATE_FIELDS = ['title', 'description', 'category', 'priority', 'attemptedSteps'];
const STAFF_UPDATE_FIELDS = ['status', 'priority', 'assignedTo'];

function pickFields(values, allowed) {
  return Object.fromEntries(Object.entries(values).filter(([key]) => allowed.includes(key)));
}

module.exports = { EMPLOYEE_CREATE_FIELDS, STAFF_UPDATE_FIELDS, pickFields };
