// Cache keys of module C (tests).

export const testsKeys = {
  all: ['tests'],
  list: () => [...testsKeys.all, 'list'],
  detail: (id) => [...testsKeys.all, 'detail', id],
  attempts: (testId) => [...testsKeys.all, 'attempts', testId],
  result: (attemptId) => [...testsKeys.all, 'result', attemptId],
}
