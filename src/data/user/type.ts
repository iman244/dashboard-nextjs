export type User = {
  username: string;
  // set by the Django API; the console uses it to decide whether the
  // signed-in user may upload or delete datasets
  is_staff: boolean;
};
