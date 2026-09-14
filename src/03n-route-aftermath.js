/* The chosen route's earned outcome is read at its next authored stop. These
   scenes consume existing combat flags; they do not revise the combat result. */
D.routeAftermathState = (state,route)=>{
  const flags=state&&state.flags||{};
  const outcomes={
    ridge:{failure:'route_ridge_failed',partial:'route_ridge_saved_partial',success:'route_ridge_saved'},
    market:{failure:'route_market_failed',partial:'route_market_escorted_partial',success:'route_market_escorted'}
  }[route];
  if(!outcomes) return null;
  if(flags[outcomes.failure]) return 'failure';
  if(flags[outcomes.partial]) return 'partial';
  if(flags[outcomes.success]) return 'success';
  return null;
};

/* The ending only reads a completed, selected aftermath. It deliberately does
   not infer a choice from resources, notes, or old combat text. */
D.routeAftermathRecall = state=>{
  const route=state&&state.routePlan&&state.routePlan.id;
  const contract={
    ridge:{event:'route_ridge_aftermath',done:'route_ridge_after_done',choices:{
      supplies:'문경 선반에 놓고 온 약 한 봉지가 떠올랐다. 그 뒤 배달이 어땠는지는 돌아가는 길에 물어봐야겠다.',
      work:'문경에서 약 꾸러미를 싸던 손이 떠올랐다. 종이에 적었던 목적지 이름 하나가 아직 기억났다.',
      handoff:'문경에서는 북쪽으로 가야 한다고 말하고 떠났다. 남은 꾸러미를 맡던 사람이 차를 빼라며 손을 들어 주었다.'
    }},
    market:{event:'route_market_aftermath',done:'route_market_after_done',choices:{
      supplies:'전주 수레 옆에 내려놓은 고철이 떠올랐다. 그 바퀴가 얼마나 갔는지는 아직 모른다.',
      work:'전주에서 수레 축을 받치던 자세 때문인지 어깨를 한 번 돌렸다. 그때 바퀴를 끼우던 사람도 이제 쉬고 있을까.',
      handoff:'전주에서는 수레 수선을 맡지 않고 북행을 이어 갔다. 장터 사람들이 비켜 준 좁은 길로 달구지가 빠져나왔었다.'
    }}
  }[route];
  const flags=state&&state.flags;
  if(!contract||!flags||!D.routeAftermathState(state,route)
    ||!Array.isArray(state.used)||!state.used.includes(contract.event)||!flags[contract.done]) return '';
  const chosen=Object.keys(contract.choices).filter(id=>flags[`route_${route}_after_${id}`]);
  return chosen.length===1?contract.choices[chosen[0]]:'';
};

const routeAftermathTurns={
  ridge:{
    success:[
      '문경 성문 아래 보급 선반에서, 능선 아래서 올라온 네 사람이 젖은 겉옷을 말리며 약 봉투를 정리하고 있었다.',
      '해열제는 전부 문경에 닿았다. 선반 주인은 상자마다 수량을 다시 적고 빈칸을 맞춰 보았다.',
      '선반 주인은 도착한 약을 안쪽 칸에 넣고, 다음 마을로 보낼 새 의약품 봉투를 선반 아래에 꺼내 놓았다.',
      '주소표와 포장 끈이 따로 놓였다. 다음 배달을 위해 약을 나누고 꾸러미를 싸는 손이 더 필요했다.'
    ],
    partial:[
      '문경 성문 아래 보급 선반에서, 능선 아래서 올라온 네 사람이 남은 약 봉투를 한 줄로 늘어놓고 있었다.',
      '네 사람은 모두 살아 문경에 닿았지만 해열제 일부를 잃었다. 선반 주인은 줄어든 수량을 그대로 장부에 적었다.',
      '잃은 약을 되돌릴 수는 없었다. 사람들은 다음 마을에 보낼 새 의약품을 작은 꾸러미로 나누고 있었다.',
      '주소표와 포장 끈이 따로 놓였다. 다음 배달을 위한 약을 고르고 싸는 손이 더 필요했다.'
    ],
    failure:[
      '문경 성문 아래 보급 선반에서, 능선 아래서 올라온 네 사람이 빈 약 상자를 접고 있었다.',
      '네 사람은 살아 문경에 닿았지만 해열제는 전부 잃었다. 구조 과정에는 부상도 생겼다.',
      '잃은 약을 되돌릴 수는 없었다. 선반 주인은 다음 마을에 보낼 새 의약품의 주소부터 다시 확인했다.',
      '빈 봉투와 포장 끈이 선반 아래에 놓였다. 다음 배달 꾸러미를 나누고 싸는 손이 더 필요했다.'
    ]
  },
  market:{
    success:[
      '전주 장터 수레 수선터에서, 검문소를 건넌 사람들이 다섯 수레의 바퀴와 짐끈을 차례로 살피고 있었다.',
      '사람과 씨앗은 모두 건넜고 이동 기록도 남지 않았다. 장터 주인은 도착한 자루 수를 장부에 맞춰 적었다.',
      '지금 손보는 것은 다음에 북쪽으로 나갈 수레였다. 새 짐을 실을 자리를 비우고 바퀴마다 쐐기를 받쳤다.',
      '고철 조각과 공구가 축 옆에 놓였다. 다음 수레를 준비하는 손이 더 필요했다.'
    ],
    partial:[
      '전주 장터 수레 수선터에서, 검문소를 건넌 사람들이 흐트러진 짐과 수레 바퀴를 다시 맞추고 있었다.',
      '사람과 씨앗, 약은 모두 건넜지만 수레 행렬은 손상을 입었다. 장터 주인은 남은 짐을 다시 세어 장부에 적었다.',
      '이번 통과의 손실을 없던 일로 만들 수는 없었다. 사람들은 다음에 북쪽으로 나갈 수레의 축과 짐자리를 준비했다.',
      '고철 조각과 공구가 바퀴 옆에 놓였다. 다음 수레를 세우는 손이 더 필요했다.'
    ],
    failure:[
      '전주 장터 수레 수선터에서, 검문소를 빠져나온 사람들이 비어 버린 씨앗 자루와 수레를 따로 놓고 있었다.',
      '사람들은 건넜지만 씨앗을 잃었고 이동 기록도 남았다. 장터 주인은 두 사실을 지우지 않고 장부에 적었다.',
      '수레를 고쳐도 기록이 사라지거나 씨앗이 돌아오지는 않았다. 사람들은 다음에 북쪽으로 나갈 수레를 새로 준비했다.',
      '고철 조각과 공구가 바퀴 옆에 놓였다. 다음 수레를 세우는 손이 더 필요했다.'
    ]
  }
};

const narrationTurns=lines=>lines.map(text=>({kind:'narration',text}));
const aftermathNote=(title,body)=>({type:'사건',title,body,links:['달구지']});

D.events.push(
  {id:'route_ridge_aftermath',type:'스토리',once:true,noPool:1,w:0,
   scene:'road-supply-shelter',title:'문경 보급 선반의 다음 꾸러미',
   turns:state=>narrationTurns(routeAftermathTurns.ridge[D.routeAftermathState(state,'ridge')]||routeAftermathTurns.ridge.failure),
   choices:[
    {id:'supplies',label:'의약품을 한 봉지 보태고 출발한다',req:{item:'의약품'},
      foreseeable:{expense:'의약품 1개 · 시간 15분'},out:[{p:1,
      turns:narrationTurns([
        '의약품 한 봉지를 문경 성문 아래 보급 선반에 올려놓았다.',
        '선반 주인은 봉지를 열어 수량을 세고 장부에 적었다.'
      ]),text:'의약품 한 봉지를 보급 선반에 놓았고, 선반 주인이 수량을 기록했다.',
      fx:{item:{'의약품':-1},time:15,flag:'route_ridge_after_supplies',flag2:'route_ridge_after_done',
        note:aftermathNote('문경 보급 선반에 보탠 약','의약품 한 봉지를 보급 선반에 놓고 수량 기록을 확인했다.')}}]},
    {id:'work',label:'남아서 다음 배달 꾸러미를 싼다',
      foreseeable:{expense:'시간 90분 · 추가 피로 +4 · 시간 경과 피로 별도'},out:[{p:1,
      turns:narrationTurns([
        '약 봉투를 수량별로 나누고, 다음 배달 꾸러미를 포장 끈으로 묶었다.',
        '도착지를 하나씩 적어 붙이는 동안 성문 아래 시계가 한 칸 앞으로 갔다.'
      ]),text:'다음 배달 꾸러미를 싸고 도착지를 붙이는 동안 시간이 흘렀다.',
      fx:{time:90,fatigue:4,flag:'route_ridge_after_work',flag2:'route_ridge_after_done',
        note:aftermathNote('문경에서 싼 다음 약 꾸러미','다음 배달 의약품을 나누어 싸고 꾸러미마다 도착지를 적었다.')}}]},
    {id:'handoff',label:'북쪽으로 가야 한다고 말하고 떠난다',
      foreseeable:{expense:'시간 10분'},out:[{p:1,
      turns:narrationTurns([
        '북쪽으로 가야 한다고 설명하자 선반 주인은 고개를 끄덕이고 길을 비켜 주었다.',
        '그는 다시 포장 끈을 당겼고, 나는 달구지로 돌아갔다.'
      ]),text:'북쪽으로 가야 한다고 말하자 선반 주인은 다시 꾸러미를 싸기 시작했다.',
      fx:{time:10,flag:'route_ridge_after_handoff',flag2:'route_ridge_after_done',
        note:aftermathNote('문경 보급 선반에서 북행을 알림','북쪽으로 가야 한다고 설명하고 보급 선반을 떠났다.')}}]}
   ]},
  {id:'route_market_aftermath',type:'스토리',once:true,noPool:1,w:0,
   scene:'jeonju-market',title:'전주 수선터의 다음 수레',
   turns:state=>narrationTurns(routeAftermathTurns.market[D.routeAftermathState(state,'market')]||routeAftermathTurns.market.failure),
   choices:[
    {id:'supplies',label:'수레를 고칠 고철을 보탠다',req:{scrap:2},
      foreseeable:{expense:'고철 2 · 시간 20분'},out:[{p:1,
      turns:narrationTurns([
        '고철 두 개를 바퀴 옆 부품 더미에 내려놓았다.',
        '장터 주인은 쓸 자리를 살펴본 뒤 두 조각을 축 옆에 따로 놓았다.'
      ]),text:'고철 두 개를 바퀴 옆에 놓았고, 장터 주인이 쓸 자리를 골랐다.',
      fx:{scrap:-2,time:20,flag:'route_market_after_supplies',flag2:'route_market_after_done',
        note:aftermathNote('전주 수레 옆에 놓은 고철','수레 바퀴를 고칠 고철 두 개를 축 옆 부품 더미에 보탰다.')}}]},
    {id:'work',label:'남아서 수레 수선을 거든다',
      foreseeable:{expense:'시간 90분 · 추가 피로 +4 · 시간 경과 피로 별도'},out:[{p:1,
      turns:narrationTurns([
        '수레 축이 움직이지 않게 두 손으로 붙들었다.',
        '장터 주인이 새 바퀴를 끼우고 쐐기를 박는 동안 수선터 시계가 한 칸 앞으로 갔다.'
      ]),text:'수레 축을 붙들고 장터 주인이 바퀴를 끼우는 일을 도왔다.',
      fx:{time:90,fatigue:4,flag:'route_market_after_work',flag2:'route_market_after_done',
        note:aftermathNote('전주에서 거든 수레 수선','수레 축을 붙들고 장터 주인이 다음 수레의 바퀴를 끼우는 일을 도왔다.')}}]},
    {id:'handoff',label:'북쪽으로 가야 한다고 말하고 떠난다',
      foreseeable:{expense:'시간 10분'},out:[{p:1,
      turns:narrationTurns([
        '북쪽으로 가야 한다고 설명하자 사람들이 수레 사이에 달구지가 나갈 자리를 만들었다.',
        '달구지가 수선터를 빠져나간 뒤에도 망치 소리는 계속 이어졌다.'
      ]),text:'북쪽으로 가야 한다고 말하자 사람들이 길을 내주고 수레 수선을 계속했다.',
      fx:{time:10,flag:'route_market_after_handoff',flag2:'route_market_after_done',
        note:aftermathNote('전주 수선터에서 북행을 알림','북쪽으로 가야 한다고 설명하고 사람들이 내준 길로 수선터를 떠났다.')}}]}
   ]}
);
