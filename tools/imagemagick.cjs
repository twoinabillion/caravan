'use strict';
const {execFileSync}=require('node:child_process');
function runImageMagick(args,options={},exec=execFileSync){
 try{return exec('magick',args,options)}catch(error){
  if(error.code!=='ENOENT')throw error;
  return args[0]==='identify'?exec('identify',args.slice(1),options):exec('convert',args,options);
 }
}
module.exports={runImageMagick};
