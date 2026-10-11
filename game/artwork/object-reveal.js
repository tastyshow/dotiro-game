(function(root){'use strict';const W=2172,H=724,CW=8,CH=4;const palette={dark:1,brown:1,blue:1,green:1,gold:1,red:1,cream:1};
function threadColor(r,g,b){
 const hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo,luma=.2126*r+.7152*g+.0722*b;
 if(luma<64)return 'dark';
 if(delta<28||lo>180)return 'cream';
 let hue=hi===r?60*((g-b)/delta%6):hi===g?60*((b-r)/delta+2):60*((r-g)/delta+4);if(hue<0)hue+=360;
 if(hue<15||hue>=345)return 'red';
 if(hue<48)return luma<160?'brown':'gold';
 if(hue<75)return 'gold';
 if(hue<175)return 'green';
 if(hue<285)return 'blue';
 return 'red';
}
function regionFor(x,y,objects){
 const nx=x/W,ny=y/H;
 let candidates=objects.map((o,i)=>({o,i})).filter(({o})=>{const [a,b,c,d]=o.bounds;return nx>=a&&nx<=c&&ny>=b&&ny<=d});
 if(!candidates.length)candidates=objects.map((o,i)=>({o,i}));
 let best=candidates[0],distance=Infinity;
 for(const entry of candidates){const o=entry.o;const dx=(nx-o.center[0])*W/H,dy=ny-o.center[1],dist=dx*dx+dy*dy;if(dist<distance){distance=dist;best=entry}}
 return best.i;
}
function buildSequence(pixels,groups){
 const objects=groups||[{id:'scene',label:'当前物体',center:[.5,.5],bounds:[0,0,1,1],colorOrder:Object.keys(palette)}];
 const bins=objects.map(()=>Object.fromEntries(Object.keys(palette).map(k=>[k,[]])));
 for(let y=0;y<H;y+=CH)for(let x=0;x<W;x+=CW){
  let r=0,g=0,b=0,weight=0;
  for(let yy=y;yy<Math.min(H,y+CH);yy++)for(let xx=x;xx<Math.min(W,x+CW);xx++){
   const k=(yy*W+xx)*4,a=pixels[k+3]/255;if(a){weight+=a;r+=pixels[k]*a;g+=pixels[k+1]*a;b+=pixels[k+2]*a}
  }
  if(!weight)continue;
  const object=regionFor(x+CW/2,y+CH/2,objects),o=objects[object];
  const color=threadColor(r/weight,g/weight,b/weight);
  const dx=(x-o.center[0]*W)/H,dy=(y-o.center[1]*H)/H;
  // A local curved wave, with deterministic small stitch variation; no row index.
  const angle=Math.atan2(dy,dx),noise=((x*73856093^y*19349663)>>>0)%997/997;
  const flow=Math.hypot(dx,dy)+Math.sin(angle*3)*.014+noise*.016;
  bins[object][color].push({x,y,flow,object,color,label:o.label});
 }
 const tiles=[];let batch=0;
 objects.forEach((o,i)=>{
  const colors=[...new Set([...(o.colorOrder||[]),...Object.keys(palette)])].filter(c=>palette[c]);
  for(const c of colors){const list=bins[i][c];if(!list.length)continue;list.sort((a,b)=>a.flow-b.flow);for(const t of list){t.batch=batch;tiles.push(t)}batch++}
 });
 return tiles;
}

root.DOTIRO_OBJECT_REVEAL={W,H,CW,CH,buildSequence,config:{
  "cabin": [[{"id":"sky","label":"天空","center":[0.48,0.055],"bounds":[0,0,1,0.24],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"cloud-left","label":"左云团","center":[0.29,0.19],"bounds":[0.08,0.06,0.46,0.35],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"cloud-right","label":"右云团","center":[0.8,0.22],"bounds":[0.39,0.04,1,0.36],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"mountains","label":"远山","center":[0.55,0.4],"bounds":[0.15,0.25,0.92,0.6],"colorOrder":["dark","brown","blue","green","gold","red","cream"]}],[{"id":"broadleaf-left","label":"左侧阔叶树","center":[0.075,0.32],"bounds":[0,0.025,0.145,0.65],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"pines-left","label":"左侧松林","center":[0.27,0.46],"bounds":[0.1,0.12,0.47,0.7],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"pines-right","label":"右侧松林","center":[0.83,0.44],"bounds":[0.66,0.14,1,0.7],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"bushes","label":"灌木","center":[0.5,0.6],"bounds":[0,0.45,1,0.77],"colorOrder":["dark","brown","blue","green","gold","red","cream"]}],[{"id":"roof","label":"木屋屋顶","center":[0.565,0.545],"bounds":[0.435,0.44,0.685,0.635],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"walls","label":"小屋墙面","center":[0.561,0.675],"bounds":[0.45,0.57,0.675,0.79],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"chimney","label":"烟囱","center":[0.685,0.515],"bounds":[0.664,0.39,0.708,0.64],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"door-window","label":"门窗","center":[0.558,0.69],"bounds":[0.476,0.597,0.634,0.806],"colorOrder":["dark","brown","blue","green","gold","red","cream"]}],[{"id":"fence-left","label":"左侧栅栏","center":[0.325,0.716],"bounds":[0.167,0.6,0.46,0.817],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"fence-right","label":"右侧栅栏","center":[0.776,0.72],"bounds":[0.655,0.59,0.892,0.8],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"stone-path","label":"石径","center":[0.429,0.881],"bounds":[0.27,0.755,0.6,1],"colorOrder":["dark","brown","blue","green","gold","red","cream"]}],[{"id":"flowers-left","label":"左侧花草","center":[0.15,0.832],"bounds":[0,0.57,0.32,1],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"flowers-right","label":"右侧花草","center":[0.83,0.856],"bounds":[0.575,0.58,1,1],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"red-thread","label":"红毛线","center":[0.67,0.703],"bounds":[0.562,0.42,0.783,0.965],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"red-ball","label":"红线球","center":[0.555,0.411],"bounds":[0.526,0.328,0.585,0.494],"colorOrder":["dark","brown","blue","green","gold","red","cream"]}],[{"id":"tail","label":"猫尾巴","center":[0.738,0.568],"bounds":[0.691,0.39,0.784,0.679],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"ears","label":"猫耳朵","center":[0.588,0.139],"bounds":[0.501,0.005,0.683,0.326],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"paws","label":"猫咪双爪","center":[0.554,0.437],"bounds":[0.45,0.34,0.661,0.535],"colorOrder":["dark","brown","blue","green","gold","red","cream"]},{"id":"face","label":"猫脸与表情","center":[0.574,0.277],"bounds":[0.467,0.145,0.674,0.452],"colorOrder":["dark","brown","blue","green","gold","red","cream"]}]],
  "chapter-02": [
    [
      {
        "id": "sky",
        "label": "蓝色天空",
        "center": [
          0.5,
          0.025
        ],
        "bounds": [
          0,
          0,
          1,
          0.16
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "clouds-left",
        "label": "左侧云团",
        "center": [
          0.12,
          0.09
        ],
        "bounds": [
          0,
          0.01,
          0.25,
          0.2
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "clouds-right",
        "label": "右侧云团",
        "center": [
          0.77,
          0.07
        ],
        "bounds": [
          0.58,
          0,
          1,
          0.18
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "mountains",
        "label": "远山",
        "center": [
          0.39,
          0.18
        ],
        "bounds": [
          0.05,
          0.08,
          0.9,
          0.3
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "pines-left",
        "label": "左侧针叶林",
        "center": [
          0.15,
          0.24
        ],
        "bounds": [
          0,
          0.04,
          0.35,
          0.46
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "forest-center",
        "label": "中部树林",
        "center": [
          0.46,
          0.29
        ],
        "bounds": [
          0.26,
          0.08,
          0.64,
          0.49
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "forest-right",
        "label": "右侧树林",
        "center": [
          0.81,
          0.28
        ],
        "bounds": [
          0.6,
          0.02,
          1,
          0.5
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "flower-environment",
        "label": "花田环境",
        "center": [
          0.48,
          0.49
        ],
        "bounds": [
          0,
          0.38,
          1,
          0.62
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "greenhouse-roof",
        "label": "温室屋顶",
        "center": [
          0.37,
          0.18
        ],
        "bounds": [
          0.175,
          0,
          0.567,
          0.32
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "greenhouse-wings",
        "label": "温室两侧玻璃与框架",
        "center": [
          0.365,
          0.44
        ],
        "bounds": [
          0.18,
          0.3,
          0.565,
          0.6
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "greenhouse-door",
        "label": "中央拱门",
        "center": [
          0.372,
          0.51
        ],
        "bounds": [
          0.331,
          0.265,
          0.413,
          0.7
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "attached-roses",
        "label": "门前藤花",
        "center": [
          0.384,
          0.28
        ],
        "bounds": [
          0.276,
          0.1,
          0.475,
          0.64
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "pots",
        "label": "附着花盆",
        "center": [
          0.397,
          0.65
        ],
        "bounds": [
          0.275,
          0.55,
          0.535,
          0.72
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "wall",
        "label": "右侧石墙",
        "center": [
          0.87,
          0.44
        ],
        "bounds": [
          0.61,
          0.39,
          1,
          0.52
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "flower-arch",
        "label": "右侧花拱",
        "center": [
          0.82,
          0.32
        ],
        "bounds": [
          0.705,
          0.16,
          0.926,
          0.69
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "path-greenhouse",
        "label": "温室前石径",
        "center": [
          0.455,
          0.87
        ],
        "bounds": [
          0.29,
          0.68,
          0.67,
          1
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "path-arch",
        "label": "花拱前石径",
        "center": [
          0.775,
          0.71
        ],
        "bounds": [
          0.68,
          0.61,
          0.85,
          0.88
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "flowers-left",
        "label": "左侧前景花草",
        "center": [
          0.15,
          0.79
        ],
        "bounds": [
          0,
          0.52,
          0.34,
          1
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "watering-can",
        "label": "浇水壶及近旁花草",
        "center": [
          0.474,
          0.67
        ],
        "bounds": [
          0.419,
          0.575,
          0.526,
          0.75
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "flowers-right",
        "label": "右侧前景花草",
        "center": [
          0.88,
          0.81
        ],
        "bounds": [
          0.72,
          0.55,
          1,
          1
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "red-thread",
        "label": "横向红毛线",
        "center": [
          0.4,
          0.81
        ],
        "bounds": [
          0,
          0.54,
          1,
          0.97
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "yarn-ball",
        "label": "红毛线球",
        "center": [
          0.643,
          0.79
        ],
        "bounds": [
          0.57,
          0.61,
          0.711,
          0.99
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "cat-tail",
        "label": "猫尾巴",
        "center": [
          0.604,
          0.14
        ],
        "bounds": [
          0.535,
          0,
          0.671,
          0.39
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-body",
        "label": "猫身体",
        "center": [
          0.567,
          0.52
        ],
        "bounds": [
          0.511,
          0.28,
          0.668,
          0.83
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-paws",
        "label": "猫爪",
        "center": [
          0.677,
          0.79
        ],
        "bounds": [
          0.517,
          0.55,
          0.795,
          0.94
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-ears",
        "label": "猫耳朵",
        "center": [
          0.753,
          0.27
        ],
        "bounds": [
          0.653,
          0.115,
          0.85,
          0.52
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-face",
        "label": "猫脸与表情",
        "center": [
          0.723,
          0.557
        ],
        "bounds": [
          0.597,
          0.37,
          0.836,
          0.775
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ]
  ],
  "chapter-03": [
    [
      {
        "id": "sky",
        "label": "蓝色天空",
        "center": [
          0.41,
          0.03
        ],
        "bounds": [
          0.12,
          0,
          0.69,
          0.17
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "clouds-left",
        "label": "左云团",
        "center": [
          0.222,
          0.09
        ],
        "bounds": [
          0.14,
          0.01,
          0.3,
          0.2
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "clouds-right",
        "label": "右云团",
        "center": [
          0.477,
          0.088
        ],
        "bounds": [
          0.4,
          0.01,
          0.56,
          0.18
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "mountains",
        "label": "中央远山",
        "center": [
          0.403,
          0.19
        ],
        "bounds": [
          0.27,
          0.065,
          0.52,
          0.31
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "trees-left",
        "label": "左侧大树与针叶林",
        "center": [
          0.12,
          0.22
        ],
        "bounds": [
          0,
          0,
          0.31,
          0.53
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "forest-middle",
        "label": "中部树林",
        "center": [
          0.45,
          0.3
        ],
        "bounds": [
          0.28,
          0.08,
          0.66,
          0.55
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "trees-right",
        "label": "右侧树林与大树",
        "center": [
          0.82,
          0.23
        ],
        "bounds": [
          0.63,
          0,
          1,
          0.57
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "rock-banks",
        "label": "溪岸岩石",
        "center": [
          0.54,
          0.57
        ],
        "bounds": [
          0.09,
          0.43,
          0.94,
          0.74
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "stream",
        "label": "溪水",
        "center": [
          0.55,
          0.69
        ],
        "bounds": [
          0.14,
          0.49,
          1,
          0.78
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "mill-roof",
        "label": "水车房屋顶",
        "center": [
          0.85,
          0.13
        ],
        "bounds": [
          0.757,
          0.028,
          0.94,
          0.24
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "mill-house",
        "label": "水车房屋身",
        "center": [
          0.852,
          0.33
        ],
        "bounds": [
          0.778,
          0.17,
          0.925,
          0.55
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "trough",
        "label": "引水槽与支架",
        "center": [
          0.709,
          0.296
        ],
        "bounds": [
          0.63,
          0.148,
          0.783,
          0.55
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "wheel",
        "label": "水车轮盘",
        "center": [
          0.747,
          0.4
        ],
        "bounds": [
          0.694,
          0.22,
          0.818,
          0.585
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "waterfall",
        "label": "落水与紧邻水花",
        "center": [
          0.703,
          0.52
        ],
        "bounds": [
          0.635,
          0.21,
          0.827,
          0.64
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "bridge",
        "label": "左石桥",
        "center": [
          0.18,
          0.388
        ],
        "bounds": [
          0.038,
          0.27,
          0.32,
          0.5
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "fence-left",
        "label": "左侧围栏",
        "center": [
          0.175,
          0.285
        ],
        "bounds": [
          0.055,
          0.2,
          0.38,
          0.37
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "fence-center",
        "label": "中部围栏",
        "center": [
          0.567,
          0.326
        ],
        "bounds": [
          0.425,
          0.22,
          0.682,
          0.435
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "fence-right",
        "label": "右侧围栏",
        "center": [
          0.947,
          0.455
        ],
        "bounds": [
          0.885,
          0.395,
          0.995,
          0.57
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "foreground-left",
        "label": "左溪岸花草",
        "center": [
          0.2,
          0.87
        ],
        "bounds": [
          0,
          0.68,
          0.43,
          1
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "foreground-right",
        "label": "右溪岸花草",
        "center": [
          0.83,
          0.88
        ],
        "bounds": [
          0.65,
          0.68,
          1,
          1
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "thread",
        "label": "溪岸红毛线",
        "center": [
          0.45,
          0.828
        ],
        "bounds": [
          0,
          0.53,
          1,
          0.98
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "ball",
        "label": "红毛线球",
        "center": [
          0.58,
          0.846
        ],
        "bounds": [
          0.528,
          0.69,
          0.63,
          0.985
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "cat-tail",
        "label": "猫尾巴",
        "center": [
          0.3,
          0.16
        ],
        "bounds": [
          0.239,
          0,
          0.381,
          0.415
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-body",
        "label": "猫身体",
        "center": [
          0.33,
          0.52
        ],
        "bounds": [
          0.24,
          0.275,
          0.465,
          0.78
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-paws",
        "label": "猫爪",
        "center": [
          0.444,
          0.815
        ],
        "bounds": [
          0.246,
          0.596,
          0.606,
          0.955
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-ears",
        "label": "猫耳朵",
        "center": [
          0.51,
          0.313
        ],
        "bounds": [
          0.402,
          0.148,
          0.616,
          0.5
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-face",
        "label": "猫脸与表情",
        "center": [
          0.495,
          0.585
        ],
        "bounds": [
          0.369,
          0.419,
          0.583,
          0.73
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ]
  ],
  "chapter-04": [
    [
      {
        "id": "sky",
        "label": "暮色天空",
        "center": [
          0.38,
          0.033
        ],
        "bounds": [
          0.09,
          0,
          0.62,
          0.17
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "clouds",
        "label": "暖色云霞",
        "center": [
          0.38,
          0.104
        ],
        "bounds": [
          0.12,
          0.017,
          0.6,
          0.185
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "mountains",
        "label": "远山",
        "center": [
          0.371,
          0.258
        ],
        "bounds": [
          0.18,
          0.11,
          0.6,
          0.355
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "sun",
        "label": "落日",
        "center": [
          0.37,
          0.208
        ],
        "bounds": [
          0.34,
          0.151,
          0.396,
          0.28
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "pine-forest",
        "label": "后方针叶林",
        "center": [
          0.43,
          0.29
        ],
        "bounds": [
          0,
          0,
          0.68,
          0.56
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "tea-rows",
        "label": "茶垄",
        "center": [
          0.28,
          0.495
        ],
        "bounds": [
          0,
          0.17,
          0.64,
          0.75
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "right-tree",
        "label": "右侧大树",
        "center": [
          0.912,
          0.22
        ],
        "bounds": [
          0.6,
          0,
          1,
          0.57
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "right-plants",
        "label": "右侧花草环境",
        "center": [
          0.73,
          0.49
        ],
        "bounds": [
          0.55,
          0.29,
          1,
          0.75
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "tea-table",
        "label": "木茶台",
        "center": [
          0.916,
          0.68
        ],
        "bounds": [
          0.825,
          0.585,
          1,
          0.81
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "blue-cloth",
        "label": "蓝格布",
        "center": [
          0.945,
          0.741
        ],
        "bounds": [
          0.89,
          0.64,
          1,
          0.86
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "teapot",
        "label": "茶壶",
        "center": [
          0.946,
          0.58
        ],
        "bounds": [
          0.912,
          0.495,
          0.983,
          0.662
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cup",
        "label": "茶杯",
        "center": [
          0.892,
          0.566
        ],
        "bounds": [
          0.86,
          0.495,
          0.925,
          0.635
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "steam",
        "label": "茶汽",
        "center": [
          0.891,
          0.455
        ],
        "bounds": [
          0.867,
          0.38,
          0.9,
          0.55
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "diagonal-fence",
        "label": "斜向围栏",
        "center": [
          0.327,
          0.397
        ],
        "bounds": [
          0.09,
          0.235,
          0.51,
          0.56
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "lantern-left",
        "label": "左侧灯笼",
        "center": [
          0.087,
          0.158
        ],
        "bounds": [
          0.061,
          0.075,
          0.112,
          0.242
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "lantern-center",
        "label": "第二盏灯笼",
        "center": [
          0.179,
          0.234
        ],
        "bounds": [
          0.157,
          0.153,
          0.201,
          0.315
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "foreground-left",
        "label": "左侧前景茶叶花草",
        "center": [
          0.18,
          0.85
        ],
        "bounds": [
          0,
          0.65,
          0.4,
          1
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "foreground-right",
        "label": "右侧前景花草",
        "center": [
          0.81,
          0.85
        ],
        "bounds": [
          0.69,
          0.66,
          1,
          1
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "thread",
        "label": "茶垄红毛线",
        "center": [
          0.36,
          0.63
        ],
        "bounds": [
          0,
          0.225,
          1,
          0.96
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "yarn-ball",
        "label": "红毛线球",
        "center": [
          0.661,
          0.698
        ],
        "bounds": [
          0.582,
          0.482,
          0.738,
          0.92
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ],
    [
      {
        "id": "cat-tail",
        "label": "蜷起的猫尾巴",
        "center": [
          0.54,
          0.822
        ],
        "bounds": [
          0.413,
          0.605,
          0.665,
          0.94
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-body",
        "label": "猫身体",
        "center": [
          0.508,
          0.53
        ],
        "bounds": [
          0.414,
          0.321,
          0.627,
          0.765
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-paws",
        "label": "抱球的猫爪",
        "center": [
          0.65,
          0.636
        ],
        "bounds": [
          0.535,
          0.42,
          0.797,
          0.84
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-ears",
        "label": "猫耳朵",
        "center": [
          0.734,
          0.279
        ],
        "bounds": [
          0.641,
          0.061,
          0.858,
          0.59
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      },
      {
        "id": "cat-face",
        "label": "睡着的猫脸",
        "center": [
          0.705,
          0.46
        ],
        "bounds": [
          0.603,
          0.278,
          0.824,
          0.651
        ],
        "colorOrder": [
          "dark",
          "brown",
          "blue",
          "green",
          "gold",
          "red",
          "cream"
        ]
      }
    ]
  ]
}
};})(window);
