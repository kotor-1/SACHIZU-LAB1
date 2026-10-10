/** Jobs one after another, whoever asked (a photo's reading, the camera's): the model runtime's run() keeps allocations
 * on its module's stack across its awaits, so two runs overlapping (the camera took a picture while a photo was still
 * being read, or a reading went on after やめる) would restore each other's stack. A job's failure does not hold up the
 * next. */
let turn: Promise<unknown> = Promise.resolve();
export function inTurn<T>(job: () => Promise<T>): Promise<T> {
  const next = turn.then(job, job);
  turn = next.then(() => undefined, () => undefined);
  return next;
}
