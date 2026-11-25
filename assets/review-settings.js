'use strict';
// Global survey and account permissions are independent of dish-specific consumer templates.
function surveyDefault(){return {enabled:true,title:'您的反馈，让老乡鸡更透明',intro:'花30秒，聊聊您的感受',version:1,questions:[
 {id:'q-rating',type:'rating',title:'这份“食材档案”，您打几分？',required:true},
 {id:'q-trust',type:'single',title:'看完之后，您对这顿饭吃得更放心了吗？',required:true,options:['更放心了，下次还来','稍微安心一点','感觉差不多','反而有点担心'],followup:true,followupOption:3},
 {id:'q-interest',type:'multi',title:'关于这道菜，您还想看到哪些“背后的故事”？',required:true,options:['它从哪儿来','吃了什么、用了什么药','一路冷不冷','后厨怎么做的','有没有检测过','门店干不干净','做饭的人有没有健康证','其他（选填）'],other:true},
 {id:'q-suggest',type:'text',title:'想吐槽、想表扬、想提建议，都写在这儿吧',required:false,limit:100}]};}
function surveyNormalize(d){d.version||=1;d.questions=(d.questions||[]).filter(q=>q.enabled!==false).map((q,i)=>{const n={...q,id:q.id||'legacy-q-'+i};delete n.enabled;return n});return d;}
function surveyLoad(){try{return surveyNormalize(JSON.parse(localStorage.getItem('lxj-global-survey-v1'))||surveyDefault())}catch{return surveyDefault()}}
function surveyTypeLabel(q){return {rating:'星级评分',text:'开放问题',single:'选择题（单选）',multi:'选择题（多选）'}[q.type]||q.type;}
function surveyForm(){const d=state.surveyDraft;return `<div class="notice-review">全局生效 · 所有菜品共用。可新增、删除问题并选择题型。已提交的评价按当时问卷留存，后续修改不改变历史问题与回答。</div><form id="survey-form"><div class="field"><label><input type="checkbox" data-survey="enabled" ${d.enabled?'checked':''}> 允许消费者评价</label></div><div class="field"><label>问卷标题</label><input maxlength="60" data-survey="title" value="${esc(d.title)}"></div><div class="field"><label>引导说明</label><input maxlength="120" data-survey="intro" value="${esc(d.intro)}"></div><div class="survey-config-body">${d.questions.map((q,i)=>`<section class="survey-question" data-question="${i}"><div class="section-title">Q${i+1} · ${surveyTypeLabel(q)}<span class="right"><label><input type="checkbox" data-q="required" ${q.required?'checked':''}> 必答</label>　<button type="button" class="text survey-delete" data-act="survey-delete" data-index="${i}">删除问题</button></span></div><div class="survey-type-row"><div class="field"><label>题型</label><select data-q="type" aria-label="第${i+1}题题型">${[['rating','星级评分'],['text','开放问题'],['single','选择题']].map(([v,n])=>`<option value="${v}" ${(q.type==='multi'?'single':q.type)===v?'selected':''}>${n}</option>`).join('')}</select></div>${q.options?`<div class="field"><label>选择方式</label><select data-q="choiceMode"><option value="single" ${q.type==='single'?'selected':''}>单选</option><option value="multi" ${q.type==='multi'?'selected':''}>多选</option></select></div>`:''}</div><div class="field"><label>题目内容</label><input data-q="title" maxlength="100" value="${esc(q.title)}"></div>${q.options?`<div class="field"><label>选项（每行一个，2～12项）</label><textarea data-q="options" rows="5">${esc(q.options.join('\n'))}</textarea></div>`:''}${q.type==='rating'?'<p class="note">消费者可选择 1～5 星。</p>':''}${q.type==='single'?`<label><input type="checkbox" data-q="followup" ${q.followup?'checked':''}> 命中指定选项后显示选填追问（最多100字）</label><div class="field"><label>追问触发选项（选项序号）</label><input type="number" data-q="followupOption" min="1" max="${q.options.length}" value="${(q.followupOption||0)+1}"></div>`:''}${q.type==='multi'?`<label><input type="checkbox" data-q="other" ${q.other?'checked':''}> 最后一个选项附带“其他”选填输入（最多100字）</label>`:''}${q.type==='text'?`<div class="field"><label>最大字数（1～500）</label><input data-q="limit" type="number" min="1" max="500" value="${q.limit||100}"></div>`:''}</section>`).join('')||'<div class="empty">暂无问题，请新增问题。</div>'}</div><button type="button" class="plain" data-act="survey-add">＋ 新增问题</button><p class="error" id="survey-error" role="alert"></p></form><p class="note">本地演示。预览中提交的回答可在“溯源评价记录”查看，未接入线上服务。</p>`;}
function readSurvey(){const root=$('#survey-form');if(!root)return;$$('[data-survey]',root).forEach(el=>state.surveyDraft[el.dataset.survey]=el.type==='checkbox'?el.checked:el.value);$$('[data-question]',root).forEach(section=>{const q=state.surveyDraft.questions[Number(section.dataset.question)];$$('[data-q]',section).forEach(el=>{const k=el.dataset.q;if(['type','choiceMode'].includes(k))return;let v=el.type==='checkbox'?el.checked:el.value;if(k==='options')v=v.split('\n').map(x=>x.trim()).filter(Boolean);if(k==='limit')v=Number(v);if(k==='followupOption')v=Number(v)-1;q[k]=v;});});}
function surveyValidate(){const d=state.surveyDraft;if(!d.title.trim())return '请填写问卷标题';if(!d.enabled)return '';if(!d.questions.length)return '请至少新增一道评价问题';for(const q of d.questions){if(!q.title.trim())return '请填写每道问题的题目内容';if(q.options&&(q.options.length<2||q.options.length>12||new Set(q.options).size!==q.options.length))return '选项须为2～12项且不能重复';if(q.followup&&(!Number.isInteger(q.followupOption)||q.followupOption<0||q.followupOption>=q.options.length))return '追问触发序号超出选项范围';if(q.type==='text'&&(!Number.isInteger(q.limit)||q.limit<1||q.limit>500))return '文本最大字数须为1～500的整数'}return '';}
function openSurvey(fresh=true){if(fresh)state.surveyDraft=structuredClone(surveyLoad());openOverlay('评价模板配置 · 所有菜品',surveyForm(),btn('消费者预览','survey-preview','plain')+btn('保存配置','survey-save','primary')+btn('取消','close-overlay','plain'),'drawer','survey');}
function surveyPreview(){readSurvey();const err=surveyValidate();if(err){$('#survey-error').textContent=err;return}const d=state.surveyDraft;state.surveyPreviewId=null;openOverlay('消费者评价预览',!d.enabled?'<div class="empty">评价功能已关闭，消费者不显示评价入口。</div>':`<div class="survey-phone"><h3>${esc(d.title)}</h3><p class="muted">${esc(d.intro)}</p><form id="survey-answer">${d.questions.map((q,i)=>`<section class="survey-question"><strong>${i+1}. ${esc(q.title)} ${q.required?'<span class="required">*</span>':'（选填）'}</strong>${q.type==='rating'?`<div class="survey-stars" role="group" aria-label="五星评分">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="q${i}" value="${n}">${n}★</label>`).join('')}</div>`:q.options?`<div class="scope-list">${q.options.map((o,j)=>`<label><input type="${q.type==='multi'?'checkbox':'radio'}" name="q${i}" value="${j}" data-answer-question="${i}">${esc(o)}</label>`).join('')}</div>${q.followup?`<textarea hidden data-followup="${i}" name="followup${i}" maxlength="100" placeholder="能说说您在担心什么吗？（选填）"></textarea>`:''}${q.other?`<textarea hidden data-other="${i}" name="other${i}" maxlength="100" placeholder="请补充您想了解的内容（选填）"></textarea>`:''}`:`<textarea name="q${i}" maxlength="${q.limit}" placeholder="请填写您的建议（最多${q.limit}字）"></textarea>`}</section>`).join('')}<p id="answer-error" class="error" role="alert"></p></form><p class="note">提交后写入本机“溯源评价记录”，记录来源标记为预览演示。</p></div>`,btn('返回配置','survey-back','plain')+(d.enabled?btn('提交反馈（演示）','survey-submit','primary')+btn('查看评价记录','survey-records','plain'):''),'dialog','survey-preview');}
function submitSurveyDemo(){if(state.surveyPreviewId){$('#answer-error').textContent='本次回答已保存，请勿重复提交';return}const d=state.surveyDraft,answers=[];for(let i=0;i<d.questions.length;i++){const q=d.questions[i],input=$(`[name="q${i}"]`),checked=$$(`[name="q${i}"]:checked`);const value=q.type==='text'?input.value.trim():q.type==='rating'?(checked[0]?Number(checked[0].value):null):checked.map(x=>q.options[Number(x.value)]);if(q.required&&(value==null||value===''||Array.isArray(value)&&!value.length)){$('#answer-error').textContent='请完成所有必答题后再提交';return}answers.push({questionId:q.id,value,followup:q.followup&&checked.some(x=>Number(x.value)===q.followupOption)?$(`[name="followup${i}"]`).value.trim():'',other:q.other&&checked.some(x=>Number(x.value)===q.options.length-1)?$(`[name="other${i}"]`).value.trim():''});}
 const p=PAGES.find(p=>p.id==='feedback'),rows=records(p),time=new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}),key='survey-demo-'+Date.now();const saved=surveyLoad(),isSaved=JSON.stringify(saved.questions)===JSON.stringify(d.questions)&&saved.title===d.title;const r={_key:key,'溯源记录编码':'EV'+Date.now(),'门店编码':'5141','门店名称':storeNames[0],'菜品编码':'600000','菜品名称':dishNames[0],'溯源时间':time,'评价时间':time,'消费者溯源报告编码':'预览演示','用户UID':'演示用户','是否评价':'是',_surveySnapshot:structuredClone(d),_surveyVersion:isSaved?'V'+saved.version:'未发布草稿（预览演示）',_surveyAnswers:answers,_evaluationSource:'预览演示'};updateFeedbackFields(r);const updated=[r,...rows];try{localStorage.setItem('lxj-prototype-v1',JSON.stringify({...dataStore,feedback:updated}))}catch{$('#answer-error').textContent='保存失败，未写入评价记录';return}dataStore.feedback=updated;state.surveyPreviewId=key;$('#answer-error').textContent='反馈已保存，可点击“查看评价记录”查看题目与回答';$('[data-act="survey-submit"]').disabled=true;}
function answerText(a){if(!a)return '未作答';const value=Array.isArray(a.value)?a.value.join('、'):a.value;return (value==null||value===''?'未作答':String(value))+(a.followup?'；追问：'+a.followup:'')+(a.other?'；其他：'+a.other:'');}
function updateFeedbackFields(r){const s=r._surveySnapshot;if(!s)return;r['问卷版本']=r._surveyVersion||'V1';r['评价时间']||=r['溯源时间'];r['评价来源']=r._evaluationSource||'演示数据';r['评价内容']=s.questions.map((q,i)=>`Q${i+1} ${q.title}：${q.type==='rating'&&r._surveyAnswers?.find(a=>a.questionId===q.id)?.value!=null?answerText(r._surveyAnswers.find(a=>a.questionId===q.id))+'星':answerText(r._surveyAnswers?.find(a=>a.questionId===q.id))}`).join('\n');}
function normalizeFeedback(r,i){if(r._surveySnapshot){updateFeedbackFields(r);return}if(r._surveyMigrationDone)return;r._surveyMigrationDone=true;
 // Old free-text answers have no reliable question mapping; never reinterpret them using a new template.
 r['问卷版本']='旧版（无结构快照）';r['评价来源']='历史原型数据';r['评价时间']=r['溯源时间'];if(!r['评价内容']||r['评价内容']==='—'||r['评价内容']==='原型演示记录')r['评价内容']='暂无结构化回答，可使用评价预览提交一条演示记录';
}
function feedbackDetailHTML(p,r){const fields=p.columns.filter(f=>!['操作','评价内容'].includes(f.name));const s=r._surveySnapshot;return panel('评价基本信息',infoHTML(fields,r))+panel('评价内容',s?`<div class="feedback-answers"><h3>${esc(s.title)}</h3><p class="note">按评价提交时的问卷结构展示，后续模板增删题不影响本记录。</p>${s.questions.map((q,i)=>{const a=r._surveyAnswers.find(a=>a.questionId===q.id);return `<section class="survey-question"><div class="feedback-question-head"><strong>Q${i+1}. ${esc(q.title)}</strong><span class="status">${surveyTypeLabel(q)}</span><span class="muted">${q.required?'必答':'选答'}</span></div>${q.options?`<p class="note">当时选项：${q.options.map(esc).join(' / ')}</p>`:''}<p class="feedback-answer">${esc(answerText(a))}${q.type==='rating'&&a?.value!=null?' / 5星':''}</p></section>`}).join('')}</div>`:`<div class="feedback-answers"><p>${esc(r['评价内容']||'暂无回答')}</p><p class="note">旧记录未保存题目结构，保留原始内容，不将旧回答对应到新问题。</p></div>`);}
function permissionCatalog(){const leaf=(id,label)=>({id,label});const stores=storeNames.map((name,i)=>leaf('store-'+i,name));return [
 {id:'stores',name:'门店',nodes:[{id:'region-ah',label:'安徽区域',children:[{id:'team-hf',label:'合肥战队',children:[stores[0],stores[4]]}]},{id:'region-js',label:'江苏区域',children:[{id:'team-nj',label:'南京战队',children:[stores[1],stores[5]]}]},{id:'region-east',label:'沪杭区域',children:[{id:'team-sh',label:'上海战队',children:[stores[2]]},{id:'team-hz',label:'杭州战队',children:[stores[3]]}]}]},
 {id:'companies',name:'区域公司（组织架构）',nodes:[{id:'org-root',label:'老乡鸡集团',children:[{id:'org-east',label:'华东事业部',children:[leaf('co-ah','安徽区域公司'),leaf('co-js','江苏区域公司'),leaf('co-sh','上海区域公司'),leaf('co-zj','浙江区域公司')]}]}]},
 {id:'factories',name:'工厂',nodes:['合肥食品工厂','南京食品工厂','上海食品工厂'].map((n,i)=>leaf('factory-'+i,n))},
 {id:'warehouses',name:'仓库',nodes:['合肥仓储中心','南京仓储中心','上海仓储中心'].map((n,i)=>leaf('warehouse-'+i,n))},
 {id:'products',name:'产品品类',nodes:[{id:'food',label:'食品品类',children:['禽肉类','蛋品类','蔬菜类','粮油类','豆制品类'].map((n,i)=>leaf('product-'+i,n))}]},
 {id:'suppliers',name:'供应商分类',nodes:[{id:'supplier-root',label:'供应商分类',children:['农牧类供应商','食材类供应商','包材类供应商','物流服务商'].map((n,i)=>leaf('supplier-'+i,n))}]},
 {id:'externalSupplier',name:'外部供应商',single:true}
 ];}
const rolePermissionExamples=[
 {name:'食安管理员',menus:null},
 {name:'门店运营',menus:['store','store-in','location','storage','temperature','return','loss','transfer']},
 {name:'仓储专员',menus:['warehouse','warehouse-in','warehouse-out']},
 {name:'央厨专员',menus:['kitchen','mes-in','production']},
 {name:'产品资料维护',menus:['material','dish','material-template']},
 {name:'供应商质量专员',menus:['supplier','supplier-template']}
];
const menuDataDimensions={
 stores:['material-reverse','reverse','public-report','complaint','consumer','dish-display','dish','delivery','store','location','store-in','storage','return','loss','transfer','temperature','feedback'],
 companies:['complaint','event','inspection','warehouse','warehouse-in','warehouse-out','kitchen','mes-in','production','delivery','store','location','store-in','storage','return','loss','transfer','temperature'],
 factories:['forward','material-reverse','reverse','kitchen','mes-in','production'],
 warehouses:['forward','material-reverse','reverse','warehouse','warehouse-in','warehouse-out','delivery','transfer'],
 products:['forward','material-reverse','reverse','public-report','overview','material-template','supplier-template','consumer','dish-display','material','dish','warehouse-in','warehouse-out','mes-in','production','store-in','storage','return','loss','transfer'],
 suppliers:['forward','material-reverse','reverse','supplier-template','supplier','warehouse-in','mes-in']
};
const additionalMenuActions={
 'public-report':['批量关闭溯源报告','导出'],
 'material-template':['编辑','发布'],
 'supplier-template':['编辑','发布'],
 link:['编辑','确认保存'],
 consumer:['发布','评价模板配置'],
 'dish-display':['消费者溯源开关','按原料批量关闭展示'],
 'alert-config':['编辑','保存'],
 warehouse:['仓储存储记录'],
 location:['批量添加']
};
const permissionMenus=()=>PAGES.filter(p=>!p.hiddenFromMenu);
const permissionRoles=()=>records(PAGES.find(p=>p.id==='role'));
const permissionUsers=()=>records(PAGES.find(p=>p.id==='user'));
const allDataScope=()=>({mode:'all',ids:[]});

function isExternalSupplierRole(role){
 return role._key==='role-external-supplier'||/^外部供应商(?:角色)?$/.test(String(role['角色名称']||'').trim());
}

function ensureExternalSupplierRole(roles){
 if(roles.some(isExternalSupplierRole))return;
 roles.push({_key:'role-external-supplier','角色编码':'R-EXT-SUPPLIER','角色名称':'外部供应商',
  '状态':'启用','说明':'外部供应商授权演示',_permissions:{menuGrants:{supplier:['查看']}}});
}

function dimensionScope(draft,dimension){
 return draft.dimensions?.[dimension.id]||(dimension.single?{mode:'custom',ids:[]}:allDataScope());
}

function menuPermissionActions(menu){
 const create=canCreateListRecord(menu)?[menu.kind==='knowledge'?'上传文档':'新增']:[];
 const versions=menu.kind==='template'?['新增版本']:[];
 const exports=menu.kind==='report'?['导出']:[];
 return [...new Set([...menu.uiActions,...create,...versions,...exports,...(additionalMenuActions[menu.id]||[])])];
}

function roleMenuGrants(role){
 const stored=role._permissions;
 const example=rolePermissionExamples.find((item,i)=>item.name===role['角色名称']&&role._key==='role-'+i);
 const legacyNames={'发布模板':'发布','修改展示配置':'编辑','索引重建':'发起重建'};
 return Object.fromEntries(permissionMenus().flatMap(menu=>{
  const choices=menuPermissionActions(menu);
  if(stored?.menuGrants){
   if(!Array.isArray(stored.menuGrants[menu.id]))return [];
   return [[menu.id,choices.filter(action=>stored.menuGrants[menu.id].includes(action))]];
  }
  if(stored?.menus?.some(id=>id===menu.group||id===menu.id)){
   const operations=(stored.operations||[]).filter(action=>{
    if(action==='修改展示配置')return menu.id==='consumer';
    if(action==='发布模板')return menu.kind==='template';
    return true;
   }).map(action=>legacyNames[action]||action);
   return [[menu.id,choices.filter(action=>operations.includes(action))]];
  }
  return !stored&&example&&(example.menus===null||example.menus.includes(menu.id))?[[menu.id,choices]]:[];
 }));
}

function userRoleIds(user){
 const saved=user._permissions?.roles;
 if(Array.isArray(saved))return [...new Set(saved)];
 const names=String(user['角色']||'').split(/[、，,]/).map(name=>name.trim());
 return names.flatMap(name=>{
  const matches=permissionRoles().filter(role=>role['角色名称']===name);
  const role=matches.length===1?matches[0]:matches.find(r=>r._key==='role-0'&&name===rolePermissionExamples[0].name);
  return role?[role._key]:[];
 });
}

function userRoleNames(ids){
 return permissionRoles().filter(role=>ids.includes(role._key)).map(role=>role['角色名称']);
}

function userRoleLabels(user){
 const names=userRoleNames(userRoleIds(user));
 return names.length?names:['未分配'];
}

function activePermissionDimensions(roleIds){
 const roles=permissionRoles().filter(role=>role['状态']==='启用'&&roleIds.includes(role._key));
 const menus=new Set(roles.flatMap(role=>Object.keys(roleMenuGrants(role))));
 const dimensions=Object.entries(menuDataDimensions).filter(([,ids])=>ids.some(id=>menus.has(id))).map(([id])=>id);
 if(roles.some(isExternalSupplierRole))dimensions.push('externalSupplier');
 return dimensions;
}

function userPermissionDraft(user){
 const saved=user._permissions||{};
 const roles=userRoleIds(user);
 const dimensions=structuredClone(saved.dimensions||{});
 const seenDimensions=[...new Set([...(saved.seenDimensions||Object.keys(dimensions)),...activePermissionDimensions(roles)])];
 return {roles,dimensions,seenDimensions};
}

function rememberActiveDimensions(draft){
 draft.seenDimensions=[...new Set([...draft.seenDimensions,...activePermissionDimensions(draft.roles)])];
}

function permissionDimensionGroups(draft){
 const active=new Set(activePermissionDimensions(draft.roles));
 const catalog=permissionCatalog();
 return {
  active:catalog.filter(item=>active.has(item.id)),
  inactive:catalog.filter(item=>!active.has(item.id)&&draft.seenDimensions.includes(item.id))
 };
}

function retainUserDimensionsForRole(role){
 return permissionUsers().map(user=>{
  const draft=userPermissionDraft(user);
  if(!draft.roles.includes(role._key))return user;
  return {...user,_permissions:{...user._permissions,...draft}};
 });
}

function permissionLeaves(nodes){
 return nodes.flatMap(node=>node.children?permissionLeaves(node.children):[node]);
}

function roleChoicesHTML(selected,attribute,readOnly=false){
 const choices=permissionRoles().filter(role=>role['状态']==='启用'||selected.includes(role._key));
 return `<div class="scope-list role-assignment">${choices.map(role=>`<label>
  <input type="checkbox" ${attribute} value="${esc(role._key)}" ${selected.includes(role._key)?'checked':''} ${readOnly?'disabled':''}>
  <span>${esc(role['角色名称'])} <small class="muted">${esc(role['角色编码'])}${role['状态']==='启用'?'':' · 已禁用'}</small></span>
 </label>`).join('')||'<span class="muted">暂无可选角色</span>'}</div>`;
}

function userRoleFieldHTML(user,readOnly){
 return roleChoicesHTML(userRoleIds(user),'name="角色" data-user-role',readOnly);
}

function applyUserRoleSelection(values,previous){
 const roles=Array.isArray(values['角色'])?values['角色']:[];
 const draft=userPermissionDraft(previous||{});
 if(!previous||roles.length!==draft.roles.length||roles.some(id=>!draft.roles.includes(id))){
  draft.roles=roles;
  rememberActiveDimensions(draft);
  const reason=previous?'编辑用户时调整关联角色':'新增用户时设置关联角色';
  values._permissions={...previous?._permissions,...draft,reason};
  if(previous){
   const before=permissionSnapshot(userPermissionDraft(previous));
   const after=permissionSnapshot(draft);
   values._permissionHistory=[...(previous._permissionHistory||[]),permissionHistoryEntry(reason,before,after)];
  }
 }
 values['角色']=userRoleNames(roles).join('、')||'未分配';
 delete values['数据范围'];
}

function permissionTree(nodes,dim,selected){
 return nodes.map(node=>{
  if(!node.children){
   return `<label class="permission-leaf"><input type="checkbox" data-scope-leaf="${dim}" value="${node.id}"
    ${selected.includes(node.id)?'checked':''}>${esc(node.label)}</label>`;
  }
  const leaves=permissionLeaves(node.children).map(leaf=>leaf.id);
  return `<details open class="permission-branch"><summary><label><input type="checkbox" data-scope-group="${dim}"
   data-leaf-ids="${esc(JSON.stringify(leaves))}" ${leaves.every(id=>selected.includes(id))?'checked':''}>${esc(node.label)}</label></summary>
   <div>${permissionTree(node.children,dim,selected)}</div></details>`;
 }).join('');
}

function roleMenuEditorHTML(grants,openGroups){
 return `<div class="section-title">菜单与操作权限</div>
  <p class="note">勾选菜单后可访问列表，再勾选该菜单允许的操作。取消菜单授权会同时移除该菜单的操作权限。</p>
  <div class="permission-menu-list">${groups.map(group=>{
   const menus=permissionMenus().filter(menu=>menu.group===group);
   const granted=menus.filter(menu=>Object.hasOwn(grants,menu.id)).length;
   return `<details class="permission-menu-group" data-permission-group="${esc(group)}" ${openGroups.has(group)?'open':''}>
    <summary><strong>${esc(group)}</strong><span class="muted">已授权 ${granted} / ${menus.length} 个菜单</span></summary>
    ${menus.map(menu=>{
     const selected=grants[menu.id];
     const actions=menuPermissionActions(menu);
     return `<div class="permission-menu-row">
      <label><input type="checkbox" id="grant-${menu.id}" data-grant-menu="${menu.id}" ${selected?'checked':''}>${esc(menu.name)}</label>
      <div class="permission-actions" role="group" aria-label="${esc(menu.name)}的操作">
       ${actions.map((action,i)=>`<label class="${selected?'':'muted'}"><input type="checkbox" id="grant-${menu.id}-${i}"
        data-grant-action="${menu.id}" value="${esc(action)}" ${selected?.includes(action)?'checked':''} ${selected?'':'disabled'}>${esc(action)}</label>`).join('')||'<span class="muted">仅菜单访问</span>'}
      </div>
     </div>`;
    }).join('')}
   </details>`;
  }).join('')}</div>`;
}

function externalSupplierOptions(){
 return templateMasterAssociations('供应商').filter(({code})=>code!=='—');
}

function externalSupplierLabel(code,options=externalSupplierOptions()){
 const supplier=options.find(item=>String(item.code)===code);
 return supplier?`${supplier.name||'名称未提供'}（${code}）`:code||'未选择';
}

function externalSupplierPickerHTML(scope){
 const options=externalSupplierOptions();
 const selected=scope.ids[0];
 return `<div class="sub-filter external-supplier-search">
  <input type="search" id="external-supplier-query" aria-label="搜索外部供应商" placeholder="搜索供应商名称 / 编码" value="${esc(state.permissionSupplierQuery)}">
  ${btn('清空选择','permission-supplier-clear','text',selected?'':'disabled')}
  <span class="muted">仅可选择一个供应商</span>
 </div>
 <p class="note" role="status" data-external-supplier-selection>已选：${esc(externalSupplierLabel(selected,options))}</p>
 <div class="scope-list external-supplier-options" role="group" aria-label="外部供应商选项">
  ${options.map(({code,name})=>`<label data-external-supplier-option>
   <input type="radio" name="externalSupplier" data-external-supplier value="${esc(code)}" ${String(code)===selected?'checked':''}>
   <span>${esc(name||'名称未提供')} <small class="muted">${esc(code)}</small></span>
  </label>`).join('')}
  <span class="muted" data-external-supplier-empty hidden>暂无符合条件的供应商</span>
 </div>`;
}

function filterExternalSuppliers(input){
 const query=input.value.trim().toLowerCase();
 const section=input.closest('.permission-dimension');
 const labels=$$('[data-external-supplier-option]',section);
 labels.forEach(label=>label.hidden=!label.textContent.toLowerCase().includes(query));
 $('[data-external-supplier-empty]',section).hidden=labels.some(label=>!label.hidden);
}

function selectExternalSupplier(section,code){
 const scope={mode:'custom',ids:code?[code]:[]};
 state.permissionEdit.dimensions.externalSupplier=scope;
 $('[data-external-supplier-selection]',section).textContent='已选：'+externalSupplierLabel(code);
 $('[data-act="permission-supplier-clear"]',section).disabled=!code;
 if(!code)$$('[data-external-supplier]',section).forEach(input=>input.checked=false);
}

function permissionScopeText(dimension,scope){
 if(dimension.single)return externalSupplierLabel(scope.ids[0]);
 if(scope.mode==='all')return '不限（全部）';
 if(scope.mode==='none')return '无权限';
 return permissionLeaves(dimension.nodes).filter(node=>scope.ids.includes(node.id)).map(node=>node.label).join('、')||'未选择';
}

function permissionDimensionHTML(dimension,scope,inactive=false){
 const {id,name,nodes}=dimension;
 const custom=scope.mode==='custom';
 return `<section class="permission-dimension ${inactive?'permission-inactive':''}" data-permission-dimension="${id}" ${inactive?'data-inactive':''}>
  <div class="section-title"><span>${esc(name)} ${inactive?'<span class="status info">已停用</span>':''}</span>
   ${dimension.single?'':`<select id="scope-${id}" data-scope-mode="${id}" aria-label="${esc(name)}授权方式" ${inactive?'disabled':''}>
    ${[['all','不限（全部）'],['custom','指定范围'],['none','无权限']].map(([value,label])=>`<option value="${value}" ${scope.mode===value?'selected':''}>${label}</option>`).join('')}
   </select>`}
  </div>
  ${inactive?`<p class="note">上次设置：${esc(permissionScopeText(dimension,scope))}</p>`:
   dimension.single?externalSupplierPickerHTML(scope):
   custom?`<div class="permission-tools"><button type="button" class="text" data-dimension-select="${id}">全选此维度</button>
    <button type="button" class="text" data-dimension-clear="${id}">清空此维度</button><span data-scope-count>已选 ${scope.ids.length} 项</span></div>
    <div class="permission-tree">${permissionTree(nodes,id,scope.ids)}</div>`:
   `<p class="note">${scope.mode==='all'?'允许查看该维度全部数据':'该维度未授权'}</p>`}
 </section>`;
}

function userPermissionEditorHTML(draft){
 const sections=permissionDimensionGroups(draft);
 return `<div class="section-title">关联角色（可多选）</div>
  ${roleChoicesHTML(draft.roles,'name="roles" data-assignment-role')}
  <div class="notice-review">多个角色的适用数据维度合并显示。常规维度首次配置默认不限（全部）。
  停用的维度保留上次设置，重新适用后恢复。</div>
  <div class="section-title">适用的数据维度</div>
  ${sections.active.map(dim=>permissionDimensionHTML(dim,dimensionScope(draft,dim))).join('')||'<p class="note">当前所选角色没有适用的数据维度。</p>'}
  ${sections.inactive.length?`<div class="section-title">已停用的数据维度</div>
   ${sections.inactive.map(dim=>permissionDimensionHTML(dim,dimensionScope(draft,dim),true)).join('')}`:''}`;
}

function permissions(p){
 state.permissionEdit=p.id==='role'?{menuGrants:roleMenuGrants(row())}:userPermissionDraft(row());
 state.permissionReason='';
 state.permissionSupplierQuery='';
 state.permissionDraft=null;
 const grants=state.permissionEdit.menuGrants||{};
 state.permissionGroups=new Set(groups.filter(group=>permissionMenus().some(p=>p.group===group&&Object.hasOwn(grants,p.id))));
 if(!state.permissionGroups.size)state.permissionGroups.add(groups[0]);
 renderPermissionEditor();
}

function capturePermission(){
 const reason=$('#change-reason');
 if(reason)state.permissionReason=reason.value;
}

function renderPermissionEditor(){
 const root=$('#permission-editor');
 const body=root?.closest('.overlay-body');
 const scroll=body?.scrollTop??0;
 const focus=document.activeElement;
 const draft=state.permissionEdit;
 const isRole=page().id==='role';
 if(isRole&&root)state.permissionGroups=new Set($$('[data-permission-group][open]',root).map(el=>el.dataset.permissionGroup));
 openOverlay(isRole?'配置角色权限':'分配角色 / 多维数据范围',`<div id="permission-editor">
  <p>当前${isRole?'角色':'用户'}：${esc(row()[isRole?'角色名称':'姓名'])}</p>
  ${isRole?roleMenuEditorHTML(draft.menuGrants,state.permissionGroups):userPermissionEditorHTML(draft)}
  <div class="field"><label for="change-reason">变更原因（必填）</label>
   <textarea id="change-reason" maxlength="500">${esc(state.permissionReason)}</textarea></div>
  <p id="permission-error" class="error" role="alert"></p></div>`,
  btn('预览权限变化','permission-preview','primary')+btn('取消','close-overlay','plain'),'drawer','permissions-v2');
 if(body)$('#permission-editor').closest('.overlay-body').scrollTop=scroll;
 if(root?.contains(focus)){
  if(focus.id)document.getElementById(focus.id)?.focus({preventScroll:true});
  if(focus.matches('[data-assignment-role]'))$$('[data-assignment-role]').find(el=>el.value===focus.value)?.focus({preventScroll:true});
 }
 const supplierQuery=$('#external-supplier-query');
 if(supplierQuery)filterExternalSuppliers(supplierQuery);
 syncPermissionMixed();
}

function syncPermissionMixed(){
 $$('[data-scope-group]').forEach(el=>{
  const ids=JSON.parse(el.dataset.leafIds);
  const selected=state.permissionEdit.dimensions?.[el.dataset.scopeGroup]?.ids||[];
  el.checked=ids.every(id=>selected.includes(id));
  el.indeterminate=!el.checked&&ids.some(id=>selected.includes(id));
 });
}

function updateScopeSelection(id,ids){
 const section=$(`[data-permission-dimension="${id}"]:not([data-inactive])`);
 if(!section)return;
 state.permissionEdit.dimensions[id].ids=ids;
 $$('[data-scope-leaf]',section).forEach(el=>el.checked=ids.includes(el.value));
 $('[data-scope-count]',section).textContent='已选 '+ids.length+' 项';
 syncPermissionMixed();
}

function permissionSnapshot(draft){
 return {...draft,effectiveDimensions:activePermissionDimensions(draft.roles)};
}

function permissionScopeSummary(draft){
 const ids=draft.effectiveDimensions||activePermissionDimensions(draft.roles||[]);
 return permissionCatalog().filter(dim=>ids.includes(dim.id))
  .map(dim=>dim.name+'：'+permissionScopeText(dim,dimensionScope(draft,dim))).join('；')||'无适用的数据维度';
}

function menuGrantChanges(before,after){
 return permissionMenus().filter(menu=>{
  const a=before[menu.id],b=after[menu.id];
  return (!!a!==!!b)||(a&&b&&(a.length!==b.length||a.some(action=>!b.includes(action))));
 });
}

function menuGrantText(actions){
 return actions?(actions.length?actions.join('、'):'仅菜单访问'):'未授权';
}

function reviewPermissions(){
 capturePermission();
 const error=$('#permission-error');
 const reason=state.permissionReason.trim();
 if(!reason){error.textContent='请填写变更原因';return;}
 const isRole=page().id==='role';
 const draft=structuredClone(state.permissionEdit);
 const record=row();
 let preview;
 if(isRole){
  const before=roleMenuGrants(record);
  const changes=menuGrantChanges(before,draft.menuGrants);
  const affected=permissionUsers().filter(user=>userRoleIds(user).includes(record._key)).length;
  preview=`<p>关联用户：${affected} 人</p>${changes.length?`<ul class="permission-changes">${changes.map(menu=>`<li>
   <strong>${esc(menu.name)}</strong><div>变更前：${esc(menuGrantText(before[menu.id]))}</div>
   <div>变更后：${esc(menuGrantText(draft.menuGrants[menu.id]))}</div></li>`).join('')}</ul>`:'<p>菜单和操作权限无变化。</p>'}`;
 }else{
  const invalid=permissionDimensionGroups(draft).active.find(dim=>!dim.single&&draft.dimensions[dim.id]?.mode==='custom'&&!draft.dimensions[dim.id].ids.length);
  if(invalid){error.textContent='请为「'+invalid.name+'」选择数据，或调整授权方式';return;}
  const before=userPermissionDraft(record);
  preview=`<p>原角色：${esc(userRoleNames(before.roles).join('、')||'未分配')}</p>
   <p>新角色：${esc(userRoleNames(draft.roles).join('、')||'未分配')}</p>
   <p>原范围：${esc(permissionScopeSummary(before))}</p><p>新范围：${esc(permissionScopeSummary(draft))}</p>`;
 }
 if(isRole)state.permissionGroups=new Set($$('[data-permission-group][open]').map(el=>el.dataset.permissionGroup));
 state.permissionDraft={...draft,reason};
 openOverlay('确认权限变更',`<p>当前${isRole?'角色':'用户'}：${esc(record[isRole?'角色名称':'姓名'])}</p>${preview}
  <p>原因：${esc(reason)}</p>`,btn('返回调整','permissions-back','plain')+btn('确认保存','permission-save','primary'),'dialog','permissions-confirm');
}

function permissionHistoryEntry(reason,before,after){
 return {time:new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}),operator:'食安管理员',reason,before,after};
}

function savePermissions(){
 const draft=state.permissionDraft;
 if(!draft)return;
 const p=page(),r=row(),isRole=p.id==='role';
 const before=isRole?{menuGrants:roleMenuGrants(r)}:permissionSnapshot(userPermissionDraft(r));
 const after=isRole?draft:permissionSnapshot(draft);
 const next={...r,_permissions:draft,_permissionHistory:[...(r._permissionHistory||[]),permissionHistoryEntry(draft.reason,before,after)]};
 delete next['数据范围'];
 if(!isRole)next['角色']=userRoleNames(draft.roles).join('、')||'未分配';
 const retainedUsers=isRole?retainUserDimensionsForRole(r):null;
 const updated=records(p).map(item=>item._key===r._key?next:item);
 const store={...dataStore,[p.id]:updated};
 if(retainedUsers)store.user=retainedUsers;
 try{localStorage.setItem('lxj-prototype-v1',JSON.stringify(store));}
 catch{toast('保存失败，尚未变更权限');return;}
 dataStore=store;
 state.permissionDraft=null;
 closeOverlay();render();toast('权限已保存（本地演示）');
}

function userDetailHTML(p,r){
 const draft=userPermissionDraft(r);
 const sections=permissionDimensionGroups(draft);
 const scopeItems=[...sections.active,...sections.inactive];
 const inactive=new Set(sections.inactive.map(dim=>dim.id));
 const scopes=scopeItems.length?`<div class="info-grid">${scopeItems.map(dim=>`<div class="info-item ${inactive.has(dim.id)?'permission-inactive':''}">
  <label>${esc(dim.name)}${inactive.has(dim.id)?'（已停用）':''}</label>
  <div class="value">${esc(permissionScopeText(dim,dimensionScope(draft,dim)))}</div></div>`).join('')}</div>`
  :'<p class="note">当前关联角色没有适用的数据维度。</p>';
 return panel('用户信息',infoHTML(p.columns,r))+panel('多维数据范围',scopes);
}

function permissionHistoryText(saved,isUser){
 if(!saved)return '未配置';
 if(isUser){
  if(!saved.effectiveDimensions&&saved.dimensions){
   return permissionScopeSummary({...saved,effectiveDimensions:Object.keys(saved.dimensions)});
  }
  return permissionScopeSummary(saved);
 }
 const grants=roleMenuGrants({_permissions:saved});
 return permissionMenus().filter(menu=>Object.hasOwn(grants,menu.id))
  .map(menu=>menu.name+'：'+menuGrantText(grants[menu.id])).join('；')||'未授权';
}

function showPermissionHistory(){
 const isUser=page().id==='user';
 openOverlay('授权变更记录',(row()._permissionHistory||[]).slice().reverse().map(entry=>`<section class="survey-question">
  <strong>${esc(entry.time)} · ${esc(entry.operator)}</strong><p>${esc(entry.reason)}</p>
  <p>变更前：${esc(permissionHistoryText(entry.before,isUser))}</p>
  <p>变更后：${esc(permissionHistoryText(entry.after,isUser))}</p></section>`).join('')||'<div class="empty">暂无授权变更记录</div>',
  btn('关闭','close-overlay','plain'),'drawer');
}

document.addEventListener('change',e=>{
 const input=e.target;
 const root=input.closest('#permission-editor');
 if(!root||input.disabled)return;
 const draft=state.permissionEdit;
 capturePermission();
 if(input.matches('[data-grant-menu]')){
  const {grantMenu}=input.dataset;
  if(input.checked)draft.menuGrants[grantMenu]=[];
  else delete draft.menuGrants[grantMenu];
  renderPermissionEditor();
 }else if(input.matches('[data-grant-action]')){
  const {grantAction}=input.dataset;
  const row=input.closest('.permission-menu-row');
  draft.menuGrants[grantAction]=$$('[data-grant-action]:checked',row).map(el=>el.value);
 }else if(input.matches('[data-assignment-role]')){
  draft.roles=$$('[data-assignment-role]:checked',root).map(el=>el.value);
  rememberActiveDimensions(draft);
  renderPermissionEditor();
 }else if(input.matches('[data-external-supplier]')&&input.checked){
  selectExternalSupplier(input.closest('.permission-dimension'),input.value);
 }else if(input.matches('[data-scope-mode]')){
  const id=input.dataset.scopeMode;
  draft.dimensions[id]={mode:input.value,ids:draft.dimensions[id]?.ids||[]};
  renderPermissionEditor();
 }else if(input.matches('[data-scope-leaf]')){
  const id=input.dataset.scopeLeaf;
  const ids=$$(`[data-scope-leaf="${id}"]:checked`,root).map(el=>el.value);
  updateScopeSelection(id,ids);
 }else if(input.matches('[data-scope-group]')){
  const id=input.dataset.scopeGroup;
  const ids=new Set(draft.dimensions[id].ids);
  for(const leaf of JSON.parse(input.dataset.leafIds)){
   if(input.checked)ids.add(leaf);
   else ids.delete(leaf);
  }
  updateScopeSelection(id,[...ids]);
 }
});

document.addEventListener('input',e=>{
 const input=e.target;
 if(!input.matches('#external-supplier-query'))return;
 state.permissionSupplierQuery=input.value;
 filterExternalSuppliers(input);
});

document.addEventListener('click',e=>{
 const control=e.target.closest('[data-dimension-select],[data-dimension-clear],[data-act="permissions-back"],[data-act="permission-supplier-clear"]');
 if(!control)return;
 if(control.dataset.act==='permissions-back'){renderPermissionEditor();return;}
 if(control.dataset.act==='permission-supplier-clear'){
  selectExternalSupplier(control.closest('.permission-dimension'),'');
  return;
 }
 const id=control.dataset.dimensionSelect||control.dataset.dimensionClear;
 const dimension=permissionCatalog().find(dim=>dim.id===id);
 updateScopeSelection(id,control.dataset.dimensionSelect?permissionLeaves(dimension.nodes).map(node=>node.id):[]);
});

document.addEventListener('change',e=>{const el=e.target;if(el.matches('[data-survey="enabled"]')){readSurvey();openSurvey(false)}if(el.matches('[data-answer-question]')){const i=Number(el.dataset.answerQuestion),q=state.surveyDraft.questions[i],inputs=$$(`[name="q${i}"]:checked`);const follow=$(`[data-followup="${i}"]`),other=$(`[data-other="${i}"]`);if(follow)follow.hidden=!inputs.some(x=>Number(x.value)===q.followupOption);if(other)other.hidden=!inputs.some(x=>Number(x.value)===q.options.length-1);}});
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;if(a==='survey-open')openSurvey();if(a==='survey-preview')surveyPreview();if(a==='survey-back')openSurvey(false);if(a==='survey-save'){readSurvey();const err=surveyValidate();if(err){$('#survey-error').textContent=err;return}const cfg={...state.surveyDraft,version:(surveyLoad().version||1)+1,updatedAt:new Date().toISOString(),updatedBy:'食安管理员'};try{localStorage.setItem('lxj-global-survey-v1',JSON.stringify(cfg))}catch{$('#survey-error').textContent='保存失败，请检查浏览器存储后重试';return}closeOverlay();toast('全局评价配置已保存')}if(a==='survey-submit')submitSurveyDemo();if(a==='survey-records'){closeOverlay();navigate('feedback')}});

 document.addEventListener('change',e=>{const el=e.target;if(!el.matches('[data-q="type"],[data-q="choiceMode"]'))return;const i=Number(el.closest('[data-question]').dataset.question);readSurvey();const q=state.surveyDraft.questions[i];const type=el.value;if(el.dataset.q==='type'){q.type=type;if(type==='single'){q.options||=['选项一','选项二'];q.followup=false;q.other=false}else{delete q.options;delete q.followup;delete q.other;if(type==='text')q.limit||=100}}else{q.type=type;q.followup=false;q.other=false}openSurvey(false);});
 document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;if(el.dataset.act==='survey-add'){readSurvey();state.surveyDraft.questions.push({id:'q-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),type:'text',title:'',required:false,limit:100});openSurvey(false);$('.survey-question:last-of-type')?.scrollIntoView?.({block:'center'});}if(el.dataset.act==='survey-delete'){readSurvey();state.surveyDraft.questions.splice(Number(el.dataset.index),1);openSurvey(false);}});

function ensureFeedbackExample(rows){if(rows.some(r=>r._surveySnapshot))return;const d=structuredClone(surveyLoad());if(!d.questions.length)return;const time=new Date().toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'});const sample={...(rows[0]||{}),_key:'feedback-structured-example','溯源记录编码':'EV-DEMO-STRUCTURED','门店编码':'5141','门店名称':storeNames[0],'菜品编码':'600000','菜品名称':dishNames[0],'溯源时间':time,'评价时间':time,'是否评价':'是',_surveySnapshot:d,_surveyVersion:'V'+d.version,_evaluationSource:'结构化示例（非真实评价）',_surveyAnswers:d.questions.map(q=>({questionId:q.id,value:q.type==='rating'?5:q.type==='text'?'希望展示更清晰的食材来源信息。':q.options.slice(0,q.type==='multi'?2:1),followup:'',other:''}))};updateFeedbackFields(sample);rows.unshift(sample);try{localStorage.setItem('lxj-prototype-v1',JSON.stringify(dataStore))}catch{}}
