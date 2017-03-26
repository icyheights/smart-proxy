'use strict'

/**
 * Create route handler that performs actions in predefined order
 * which is defined in app.locals
 *
 * when actions end handler will stop responding
 * 
 * @param countProp - app.locals property that counts requests
 * @param actionsProp - app.locals property that defines array of actions
 */
module.exports = (countProp, actionsProp) => (req, res) => {
  const action = res.app.locals[actionsProp][res.app.locals[countProp]]
  if (action) {
    action(res)
  }
  res.app.locals[countProp] += 1
}
