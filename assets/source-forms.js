'use strict';

function isSourceDeleteField(field) {
 return /删除标[识记志]|删除时间|标记删除|^(?:detail_)?del(?:ete)?_?flag$|^(?:is_?)?deleted$/i.test(field);
}

function sourceValue(value) {
 return value == null || value === '' ? '—' : value;
}

function businessNamePairs() {
 return [
  ['store','门店名称',['门店编码','收货门店编码','退货门店编码','所属门店编码']],
  ['store','拨出门店名称',['拨出门店编码']],
  ['store','拨入门店名称',['拨入门店编码']],
  ['store','所属门店名称',['所属门店编码']],
  ['store','收货门店名称',['收货门店编码']],
  ['store','退货门店名称',['退货门店编码']],
  ['product','物料名称',['物料编码','子项编码']],
  ['product','损耗物料名称',['损耗物料编码']],
  ['product','原料名称',['原料编码']],
  ['product','货品名称',['货品编码']],
  ['product','商品名称',['商品编码','商品编号']],
  ['product','成品名称',['成品编码']],
  ['product','产品名称',['产品编码']],
  ['product','菜品名称',['菜品编码']],
  ['supplier','供应商名称',['供应商编码','SAP供应商编码','SRM供应商编码']]
 ];
}

function nameFromBusinessCode(kind, code, demo) {
 let key=String(code??'').trim();
 if(!key||key==='—')return '';
 if(kind==='store')key=key.replace(/^1_/,'');
 const name=window.LXJ_SOURCE.names[kind][key];
 if(name)return name;
 if(demo){
  if(kind==='store'&&/^514[1-6]$/.test(key))return storeNames[Number(key)-5141];
  if(kind==='product'&&/^10000[0-5]$/.test(key))return materialNames[Number(key.at(-1))];
  if(kind==='product'&&/^60000[0-5]$/.test(key))return dishNames[Number(key.at(-1))];
  if(kind==='supplier'&&/^(?:V1000[0-5]|SUP00[1-3])$/.test(key)){
   const index=key.startsWith('SUP')?Number(key.at(-1))-1:Number(key.at(-1));
   return sample('供应商名称',index,page());
  }
 }
 return '名称未提供';
}

function businessFieldValue(p, fields, record, label) {
 const existing=sourceValue(record[label]);
 if(['material','dish'].includes(p.id))return existing;
 const pair=businessNamePairs().find(([,name,codes])=>name===label&&codes.some(code=>fields.some(f=>f.name===code)));
 if(!pair)return existing;
 const [kind,name,codes]=pair;
 const codeField=codes.find(code=>record[code]&&record[code]!=='—');
 if(!codeField)return existing;
 if(record._sourceSample||window.LXJ_SOURCE.pages[p.id]){
  return existing!=='—'?existing:nameFromBusinessCode(kind,record[codeField],false)||existing;
 }
 if(existing!=='—')return existing;
 return nameFromBusinessCode(kind,record[codeField],true)||existing;
}

function enrichReportNames(table, values) {
 const pairs=[
  ['store','store_name',['store_code']],['store','storeName',['storeCode','storeCodeId']],
  ['product','item_name',['merchandise_code','item_code']],['product','itemName',['itemCode']],
  ['product','productName',['productCode']],['supplier','supplier_name',['supplier','supplier_code']],
  ['supplier','supplierName',['supplierCode','supplierNum','supplier']],['supplier','shipFromName',['shipFromCode']],
  ['supplier','vendorName',['vendorCode']]
 ];
 for(const [kind,name,keys] of pairs){
  if(!table.fields.some(f=>f.visible&&f.key===name))continue;
  const key=keys.find(k=>values[k]&&values[k]!=='—');
  if(!key)continue;
  const resolved=nameFromBusinessCode(kind,values[key],true);
  if(resolved!=='名称未提供'||!values[name]||values[name]==='—')values[name]=resolved;
 }
}

function appendSourceTraceReports(reports) {
 for(const [i,chain] of window.LXJ_SOURCE.chains.entries()){
  const {receipt,line}=chain;
  const key='source-trace-'+(i+1);
  if(reports.some(report=>report._key===key))continue;
  reports.push({_key:key,_sourceTrace:i+1,'溯源报告编码':'MR-SAMPLE-'+(i+1),
   '原料编码':line['物料编码'],'原料名称':line['物料名称'],'原料批次号':line['批次号'],
   '原料收货数量':line['实收量'],'原料生产日期':line['生产日期'],'生产日期':line['生产日期'],
   '原料供应商':line['供应商名称'],'供应商名称':line['供应商名称'],'供应商编码':line['供应商编码'],
   '收货单号':receipt['收货单号'],'门店编码':receipt['门店编码'],'门店名称':receipt['门店名称']});
 }
}

const traceSampleFields={
 tb_storeRecvRecord:{
  createId:'创建人ID',guid:'记录标识',purchaseOrdeNo:'物料采购订单号',merchandiseCode:'物料编码',
  sapStoreCode:'SAP门店编码',updateId:'更新人ID'
 },
 stb_storeRsecvRecord:{
  confirmUser:'确认人工号',createId:'创建人ID',guid:'记录标识',sapStoreCode:'SAP门店编码',updateId:'更新人ID'
 },
 tb_kitchenProduction:{
  team:'班组名称',productCode:'成品编码',productName:'成品名称',productBatchCode:'批号',unitName:'单位'
 },
 stb_materialInput:{
  unitName:'单位',rawMaterialBatchCode:'批号',supplierName:'供应商名称',workOrderNo:'工单号'
 }
};
function sourceTraceRecords(table, materialIndex, parentPath) {
 const p=page();
 if(!['material-reverse','reverse'].includes(p.id))return null;
 const r=p.id==='reverse'?reportMaterials(p,row())[materialIndex]?.sourceReport:row();
 if(!r?._sourceTrace)return null;
 const chain=window.LXJ_SOURCE.chains[r._sourceTrace-1];
 let matches=[];
 if(table.id==='tb_storeRecvRecord')matches=[chain.line];
 if(table.id==='stb_storeRsecvRecord')matches=[chain.receipt];
 if(table.id==='tb_kitchenProduction')matches=[chain.production];
 if(table.id==='stb_materialInput')matches=chain.inputs;
 return matches.map((match,i)=>{
  const values={};
  for(const field of reportVisibleFields(table)){
   const name=traceSampleFields[table.id]?.[field.key]||field.name;
   values[field.key]=sourceValue(match[name]);
  }
  if(table.id==='tb_kitchenProduction')values.productionStartDate=sourceValue(match['生产开始时间']?.slice(0,10));
  return {values,_index:i,_path:[...parentPath,i],_recordKey:r._key+'-'+table.id+'-'+i};
 });
}
