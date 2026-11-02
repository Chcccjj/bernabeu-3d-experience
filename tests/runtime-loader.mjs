// Node integration tests exercise app methods and DOM, not WebGL rendering.
export function load(url,context,nextLoad){
  if(/\.(css|hdr)(\?.*)?$/.test(url))return {format:'module',shortCircuit:true,source:'export default "test-asset";'};
  return nextLoad(url,context);
}
