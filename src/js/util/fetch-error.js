function FetchError(object) {
  this.status = object.status || null;
  this.headers = object.headers || null;
  this.json = object.json || null;
  this.body = object.body || null;
}
FetchError.prototype = Error.prototype;

export default FetchError;
