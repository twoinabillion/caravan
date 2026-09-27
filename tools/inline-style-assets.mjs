/* Build-time byte deduplication only; selector ownership and URL bytes stay
   unchanged. Font-face URLs remain literal because CSS variables there are
   not consistently supported. */
export function inlineStyleAssets(source,resolve){
  const images=new Map();let count=0;
  let result=source.replace(/url\(["']?__UI_([A-Z0-9_]+)__["']?\)/g,(match,key)=>{
    count++;
    if(key.endsWith('_FONT'))return `url("${resolve(key)}")`;
    if(!images.has(key))images.set(key,resolve(key));
    return `var(--embedded-ui-${key.toLowerCase().replaceAll('_','-')})`;
  });
  if(!count)throw new Error('UI 이미지 플레이스홀더를 찾지 못함');
  const declarations=[...images].map(([key,uri])=>`--embedded-ui-${key.toLowerCase().replaceAll('_','-')}:url("${uri}")`).join(';');
  result=result.replace(/(<style\b[^>]*>)/i,`$1\n:root{${declarations}}\n`);
  return {result,count};
}
