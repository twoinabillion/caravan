// Delivery-only whitespace reduction. Never alter CSS strings, selectors,
// declarations, URLs or source files; keep newlines as token separators.
export function compactStyleSource(source){
  return source.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,(_,open,css,close)=>{
    let out='',quote='',lineStart=true;
    for(let i=0;i<css.length;i++){
      const ch=css[i];
      if(quote){
        out+=ch;
        if(ch==='\\'&&i+1<css.length) out+=css[++i];
        else if(ch===quote) quote='';
        lineStart=false;
      }else if(ch==='"'||ch==="'"){
        quote=ch;out+=ch;lineStart=false;
      }else if(ch==='/'&&css[i+1]==='*'){
        const end=css.indexOf('*/',i+2);
        if(end<0) throw new Error('Unclosed CSS comment');
        // A comment can separate tokens without a descendant-combinator space.
        // Keep an empty comment when neither neighbour is whitespace.
        if(!/\s/.test(css[i-1]||' ')&&!/\s/.test(css[end+2]||' ')) out+='/**/';
        i=end+1;
      }else if(lineStart&&(ch===' '||ch==='\t')){
        continue;
      }else{
        out+=ch;lineStart=ch==='\n'||ch==='\r';
      }
    }
    return open+out+close;
  });
}
