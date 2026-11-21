function valid(v){return v!=null&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));}
export function standardizeMatrix(matrix){
 if(!Array.isArray(matrix)||matrix.length<2||!Array.isArray(matrix[0])||matrix[0].length<2)throw new Error('At least two samples and two parameters are required.');
 const cols=matrix[0].length;if(matrix.some(r=>!Array.isArray(r)||r.length!==cols||r.some(v=>!valid(v))))throw new Error('Statistical analysis requires a complete numeric sample matrix; missing values are not imputed.');
 const means=Array.from({length:cols},(_,j)=>matrix.reduce((s,r)=>s+Number(r[j]),0)/matrix.length);
 const sd=means.map((m,j)=>Math.sqrt(matrix.reduce((s,r)=>s+(Number(r[j])-m)**2,0)/(matrix.length-1)));
 return {values:matrix.map(r=>r.map((v,j)=>sd[j]>0?(Number(v)-means[j])/sd[j]:0)),means,standardDeviations:sd};
}
export function correlationMatrix(matrix){
 const z=standardizeMatrix(matrix).values,cols=z[0].length;
 return Array.from({length:cols},(_,i)=>Array.from({length:cols},(_,j)=>z.reduce((s,r)=>s+r[i]*r[j],0)/(z.length-1)));
}
export function linearRegression(xs,ys){
 const pairs=xs.map((x,i)=>[x,ys[i]]).filter(([x,y])=>valid(x)&&valid(y)).map(([x,y])=>[Number(x),Number(y)]);
 if(pairs.length<3)throw new Error('At least three complete pairs are required for linear regression.');
 const mx=pairs.reduce((s,p)=>s+p[0],0)/pairs.length,my=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;
 const xx=pairs.reduce((s,p)=>s+(p[0]-mx)**2,0),xy=pairs.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0),yy=pairs.reduce((s,p)=>s+(p[1]-my)**2,0);
 if(xx===0)throw new Error('The predictor has no variation.');
 const slope=xy/xx,intercept=my-slope*mx,r=xy/Math.sqrt(xx*yy);
 return {n:pairs.length,slope,intercept,rSquared:Number.isFinite(r)?r*r:null,xMin:Math.min(...pairs.map(p=>p[0])),xMax:Math.max(...pairs.map(p=>p[0])),pairs};
}
function jacobiEigen(input){
 const n=input.length,a=input.map(r=>[...r]),v=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
 for(let iter=0;iter<100*n*n;iter++){
  let p=0,q=1,max=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j])>max){max=Math.abs(a[i][j]);p=i;q=j;}
  if(max<1e-10)break;
  const phi=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(phi),s=Math.sin(phi);
  const app=c*c*a[p][p]-2*s*c*a[p][q]+s*s*a[q][q],aqq=s*s*a[p][p]+2*s*c*a[p][q]+c*c*a[q][q];
  for(let k=0;k<n;k++)if(k!==p&&k!==q){const akp=a[k][p],akq=a[k][q];a[k][p]=a[p][k]=c*akp-s*akq;a[k][q]=a[q][k]=s*akp+c*akq;}
  a[p][p]=app;a[q][q]=aqq;a[p][q]=a[q][p]=0;
  for(let k=0;k<n;k++){const vp=v[k][p],vq=v[k][q];v[k][p]=c*vp-s*vq;v[k][q]=s*vp+c*vq;}
 }
 return Array.from({length:n},(_,i)=>({value:a[i][i],vector:v.map(row=>row[i])})).sort((x,y)=>y.value-x.value);
}
export function principalComponents(matrix,components=2){
 const {values,means,standardDeviations}=standardizeMatrix(matrix),n=values.length,p=values[0].length;
 if(n<3)throw new Error('PCA requires at least three complete samples.');
 const covariance=Array.from({length:p},(_,i)=>Array.from({length:p},(_,j)=>values.reduce((s,r)=>s+r[i]*r[j],0)/(n-1)));
 const eig=jacobiEigen(covariance),total=eig.reduce((s,e)=>s+Math.max(0,e.value),0);
 const selected=eig.slice(0,Math.min(components,p));
 return {scores:values.map(row=>selected.map(e=>row.reduce((s,x,j)=>s+x*e.vector[j],0))),loadings:selected.map(e=>e.vector),eigenvalues:selected.map(e=>e.value),explainedVariance:selected.map(e=>total?Math.max(0,e.value)/total:0),means,standardDeviations};
}
export function kMeans(matrix,k=3,maxIterations=100){
 const {values}=standardizeMatrix(matrix),n=values.length,p=values[0].length;
 if(!Number.isInteger(k)||k<2||k>n)throw new Error('Cluster count must be between 2 and the number of complete samples.');
 const centroids=Array.from({length:k},(_,i)=>[...values[Math.floor(i*n/k)]]);
 let labels=Array(n).fill(-1),iterations=0;
 for(;iterations<maxIterations;iterations++){
  let changed=false;
  for(let i=0;i<n;i++){let best=0,bestD=Infinity;for(let c=0;c<k;c++){const d=values[i].reduce((s,x,j)=>s+(x-centroids[c][j])**2,0);if(d<bestD){bestD=d;best=c;}}if(labels[i]!==best){labels[i]=best;changed=true;}}
  const sums=Array.from({length:k},()=>Array(p).fill(0)),counts=Array(k).fill(0);
  values.forEach((row,i)=>{counts[labels[i]]++;row.forEach((x,j)=>sums[labels[i]][j]+=x);});
  for(let c=0;c<k;c++)if(counts[c])centroids[c]=sums[c].map(x=>x/counts[c]);
  if(!changed)break;
 }
 const withinClusterSumSquares=values.reduce((s,row,i)=>s+row.reduce((d,x,j)=>d+(x-centroids[labels[i]][j])**2,0),0);
 return {labels,centroids,iterations:iterations+1,withinClusterSumSquares};
}
