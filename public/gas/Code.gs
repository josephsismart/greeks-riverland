/**
 * Greeks of the Riverland — Photo uploads, notifications and backups
 * ------------------------------------------------------------------
 * 1. Photo upload page (web app) — anyone can send up to 5 photos, no Google account needed.
 *    Photos are saved to Drive › Greeks of the Riverland › Family Photos › Website Uploads.
 * 2. Email notification for every new "Add Your Family" form submission and photo upload.
 * 3. Monthly backup copy of the submissions Sheet into Drive › Backups.
 *
 * Who gets the emails: edit the "Settings" tab in the submissions Sheet (cell B2).
 * One-time setup: run setupAll() from the editor, then Deploy › New deployment › Web app
 * (Execute as: Me · Who has access: Anyone).
 */

const CONFIG = {
  ROOT_FOLDER_ID: '1EULLF4PSzS5mww5vo3Qj8sTyIWtmqu0B',
  FORM_ID: '1fvqKJU2QC5HAVWDiVPXp1VDZ74fBojY9DMFRgnS3Ppk',
  SHEET_ID: '13t3MUpincrTxTr4hsMS4pgY5PNokFuv0sli8LQ93B9c',
  SITE_URL: 'https://sites.google.com/view/greeksoftheriverland',
  MAX_PHOTOS: 5,
  MAX_MB: 20,
  UPLOAD_FOLDER: 'Website Uploads',
  KEEP_BACKUPS: 12,
  UPLOAD_URL: 'https://script.google.com/macros/s/AKfycbzhLYzjtKO_nrwsk3J_qXKdL0ngMO3_I6rHPRe4lxHibzdpIAncmMio2-mH4MjWIkdaGg/exec',
  // Public photo upload page (GitHub Pages copy — works in every browser, including Brave/Safari)
  PHOTO_PAGE_URL: 'https://josephsismart.github.io/greeks-riverland/w/upload.html'
};

/* ============================ SETUP ============================ */

function setupAll() {
  const out = [];
  out.push(setupSheetTabs_());
  out.push(setupMap());
  out.push(getUploadRootFolder_().getUrl());
  out.push(installTriggers_());
  Logger.log(out.join('\n'));
  return out.join('\n');
}

/** Run AFTER the web app is deployed: puts the upload link into the Form's Photographs section. */
function linkUploadPageInForm() {
  const url = CONFIG.PHOTO_PAGE_URL || CONFIG.UPLOAD_URL || ScriptApp.getService().getUrl();
  if (!url) throw new Error('Deploy the web app first (Deploy › New deployment › Web app).');
  const form = FormApp.openById(CONFIG.FORM_ID);
  form.getItems(FormApp.ItemType.PAGE_BREAK).forEach(function (it) {
    if (it.getTitle() === 'Photographs') {
      it.asPageBreakItem().setHelpText(
        'To send photographs, please use our photo upload page (no Google account needed):\n' + url +
        '\n\nIf you have already sent photos, or prefer to describe them here, use the boxes below: ' +
        'who is in each photo, the approximate year, the place and a short description.');
    }
  });
  return 'Linked: ' + url;
}

function setupSheetTabs_() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  // Settings tab
  let st = ss.getSheetByName('Settings');
  if (!st) {
    st = ss.insertSheet('Settings');
    st.getRange('A1:B1').setValues([['Setting', 'Value']]).setFontWeight('bold').setBackground('#1F3A5F').setFontColor('#FFFFFF');
    st.getRange('A2:B4').setValues([
      ['Notification email(s) — separate several with commas', Session.getEffectiveUser().getEmail()],
      ['Facebook Page link', ''],
      ['Facebook Group link', '']
    ]);
    st.setColumnWidth(1, 380); st.setColumnWidth(2, 380);
  }
  // Photo uploads tab
  let ph = ss.getSheetByName('Photo Uploads');
  if (!ph) {
    ph = ss.insertSheet('Photo Uploads');
    const headers = ['Received', 'Family surname', 'Riverland town', 'Contributor name', 'Relationship to family',
      'Email', 'Phone', 'May we contact you?', 'Consent', 'Number of photos', 'Photo details', 'Drive folder',
      'Review Status', 'Reviewed By', 'Publish Notes'];
    ph.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold')
      .setBackground('#1F3A5F').setFontColor('#FFFFFF').setWrap(true);
    ph.getRange(1, 13, 1, 3).setBackground('#5E6B3A');
    ph.setFrozenRows(1);
    ph.setColumnWidth(11, 420);
    const status = ph.getRange(2, 13, 999, 1);
    status.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(['New', 'Reviewing', 'Approved', 'Published', 'Declined'], true).build());
    const rules = [['New', '#FFF4CC'], ['Reviewing', '#DCE7F5'], ['Approved', '#E3EBD3'], ['Published', '#C9DDB0'], ['Declined', '#F2D6D3']]
      .map(function (p) { return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(p[0]).setBackground(p[1]).setRanges([status]).build(); });
    ph.setConditionalFormatRules(rules);
  }
  return 'Sheet tabs ready';
}

function getUploadRootFolder_() {
  const root = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  const fp = getOrCreate_(root, 'Family Photos');
  return getOrCreate_(fp, CONFIG.UPLOAD_FOLDER);
}

function getOrCreate_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function removeFileUploadQuestions_() {
  const form = FormApp.openById(CONFIG.FORM_ID);
  let removed = 0;
  form.getItems(FormApp.ItemType.FILE_UPLOAD).forEach(function (it) { form.deleteItem(it); removed++; });
  return 'File-upload questions removed: ' + removed + ' (the form no longer needs a Google sign-in)';
}

function installTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['onFormSubmitNotify', 'onFamilySubmit', 'monthlyBackup'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFamilySubmit').forForm(CONFIG.FORM_ID).onFormSubmit().create();
  ScriptApp.newTrigger('monthlyBackup').timeBased().onMonthDay(1).atHour(3).create();
  return 'Triggers installed (form notification + monthly backup)';
}

/* ======================= NOTIFICATIONS ======================= */

function notifyEmails_() {
  try {
    const v = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName('Settings').getRange('B2').getValue();
    if (String(v).trim()) return String(v).trim();
  } catch (e) {}
  return Session.getEffectiveUser().getEmail();
}

function onFormSubmitNotify(e) {
  const answers = {};
  e.response.getItemResponses().forEach(function (r) { answers[r.getItem().getTitle()] = r.getResponse(); });
  const surname = answers['Family surname'] || '(no surname)';
  const who = answers['Your name'] || 'Someone';
  const town = [].concat(answers['Riverland town or district'] || []).join(', ');
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/' + CONFIG.SHEET_ID + '/edit';
  MailApp.sendEmail({
    to: notifyEmails_(),
    subject: 'New family submission — ' + surname + ' (Greeks of the Riverland)',
    htmlBody: '<p><b>' + esc_(who) + '</b> submitted the <b>' + esc_(surname) + '</b> family' + (town ? ' (' + esc_(town) + ')' : '') + '.</p>' +
      '<p>Nothing has been published. Review it in the Sheet and set <i>Review Status</i> when done:<br>' +
      '<a href="' + sheetUrl + '">Open the submissions Sheet</a></p>',
    name: 'Greeks of the Riverland'
  });
}

/* ========================= BACKUPS ========================= */

function monthlyBackup() {
  const root = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  const backups = getOrCreate_(root, 'Backups');
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  DriveApp.getFileById(CONFIG.SHEET_ID).makeCopy('Backup ' + stamp + ' — Submissions Sheet', backups);
  // keep only the newest backups
  const files = [];
  const it = backups.getFiles();
  while (it.hasNext()) { const f = it.next(); if (f.getName().indexOf('Backup ') === 0) files.push(f); }
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files.slice(CONFIG.KEEP_BACKUPS).forEach(function (f) { f.setTrashed(true); });
  return 'Backup saved: ' + stamp;
}

/* ====================== PHOTO UPLOAD WEB APP ====================== */

function doGet(e) {
  const pg = e && e.parameter && e.parameter.page;
  if (pg === 'map' || pg === 'towns') return townsMapPage_();
  if (pg === 'find') return findPage_();
  if (pg === 'privacy') return privacyPage_();
  if (pg === 'town') return townPage_(e.parameter.t);
  if (pg === 'data') return dataJson_(e);
  if (pg === 'oldmap') return mapPage_();
  const t = HtmlService.createTemplate(UPLOAD_HTML);
  t.maxPhotos = CONFIG.MAX_PHOTOS;
  t.siteUrl = CONFIG.SITE_URL;
  return t.evaluate()
    .setTitle('Share Family Photos — Greeks of the Riverland')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Photo upload calls from the upload page hosted on GitHub Pages (same three steps as google.script.run). */
function doPost(e) {
  let out;
  try {
    const req = JSON.parse(e.postData.contents);
    const fns = { startUpload: startUpload, uploadPhoto: uploadPhoto, finishUpload: finishUpload };
    if (!fns[req.fn]) throw new Error('Unknown request');
    out = { ok: true, result: fns[req.fn].apply(null, req.args || []) };
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Step 1: create a folder for this submission. */
function startUpload(meta) {
  validateMeta_(meta);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
  const name = stamp + ' — ' + clean_(meta.surname) + ' — ' + clean_(meta.name);
  const folder = getUploadRootFolder_().createFolder(name);
  folder.setDescription('Contributor: ' + meta.name + ' (' + meta.relationship + ')');
  return folder.getId();
}

/** Step 2: save one photo (base64) into the submission folder. */
function uploadPhoto(folderId, photo) {
  const folder = DriveApp.getFolderById(folderId);
  if (folder.getParents().next().getId() !== getUploadRootFolder_().getId()) throw new Error('Invalid folder');
  const bytes = Utilities.base64Decode(photo.data);
  if (bytes.length > CONFIG.MAX_MB * 1024 * 1024) throw new Error('Photo too large');
  const type = /^image\//.test(photo.type) ? photo.type : 'image/jpeg';
  const file = folder.createFile(Utilities.newBlob(bytes, type, clean_(photo.filename) || 'photo.jpg'));
  file.setDescription(['People: ' + (photo.people || ''), 'Year: ' + (photo.year || ''), 'Place: ' + (photo.place || ''),
    'About: ' + (photo.description || '')].join('\n'));
  return file.getId();
}

/** Step 3: log the submission and send the notification email. */
function finishUpload(folderId, meta, photos) {
  validateMeta_(meta);
  const folder = DriveApp.getFolderById(folderId);
  const details = photos.map(function (p, i) {
    return (i + 1) + '. ' + [p.people && ('People: ' + p.people), p.year && ('Year: ' + p.year), p.place && ('Place: ' + p.place), p.description].filter(String).join(' · ');
  }).join('\n');
  const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName('Photo Uploads');
  sh.appendRow([new Date(), meta.surname, meta.town || '', meta.name, meta.relationship, meta.email, meta.phone || '',
    meta.contact ? 'Yes' : 'No', 'I agree', photos.length, details, folder.getUrl(), 'New', '', '']);
  const regId = linkUploadToRegister_(meta, folder, photos.length);
  MailApp.sendEmail({
    to: notifyEmails_(),
    subject: 'New family photos — ' + meta.surname + ' (' + photos.length + ' photo' + (photos.length === 1 ? '' : 's') + ')',
    htmlBody: '<p><b>' + esc_(meta.name) + '</b> (' + esc_(meta.relationship) + ') sent ' + photos.length + ' photo(s) of the <b>' +
      esc_(meta.surname) + '</b> family' + (regId ? ' (matched to ' + regId + ' in the Family Register)' : '') + '.</p><p><a href="' + folder.getUrl() + '">Open the photos in Drive</a> · ' +
      '<a href="https://docs.google.com/spreadsheets/d/' + CONFIG.SHEET_ID + '/edit">Review in the Sheet (Photo Uploads tab)</a></p>' +
      '<p>Nothing has been published.</p>',
    name: 'Greeks of the Riverland'
  });
  return 'ok';
}

function validateMeta_(m) {
  if (!m || !m.name || !m.email || !m.surname || !m.relationship) throw new Error('Please fill in the required fields.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) throw new Error('Please enter a valid email address.');
  if (!m.consent) throw new Error('Please tick the consent box.');
}
function clean_(s) { return String(s || '').replace(/[\\\/:*?"<>|]/g, ' ').trim().slice(0, 80); }
function esc_(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ============================ PAGE ============================ */

const UPLOAD_HTML = String.raw`<!DOCTYPE html>
<html><head><base target="_top">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
<style>
:root{--navy:#1F3A5F;--olive:#5E6B3A;--gold:#B8914A;--gold2:#E2C48E;--cream:#F6F1E6;--line:#e4d9c3;--muted:#6b6257}
*{box-sizing:border-box}body{margin:0;background:#fbf8f1;color:#2f2a24;font:16px/1.6 Lora,Georgia,serif}
.top{background:linear-gradient(135deg,#1f3a5f,#26466b 60%,#3d4f3a);color:#fff;padding:34px 18px 30px;text-align:center;position:relative}
.top:after{content:"";position:absolute;left:0;right:0;bottom:0;height:12px;opacity:.4;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='14'%3E%3Cpath d='M0 13h6V5h8v4h-4V7H8v6h12V1H2' fill='none' stroke='%23E2C48E' stroke-width='1.6'/%3E%3C/svg%3E") repeat-x}
.top a{color:var(--gold2);font-size:14px;text-decoration:none}
.eyebrow{letter-spacing:4px;font-size:12px;color:var(--gold2);font-weight:600;text-transform:uppercase}
h1{font-family:'Libre Baskerville',serif;font-weight:400;font-size:clamp(26px,5vw,38px);margin:8px 0}
h2{font-family:'Libre Baskerville',serif;color:var(--navy);font-weight:400;font-size:22px;margin:0 0 12px}
.wrap{max-width:820px;margin:0 auto;padding:24px 16px 60px}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;margin-bottom:18px;box-shadow:0 2px 10px rgba(31,58,95,.06)}
label{display:block;font-weight:600;font-size:14px;color:var(--navy);margin:12px 0 4px}
label small{font-weight:400;color:var(--muted)}
input[type=text],input[type=email],input[type=tel],textarea,select{width:100%;padding:11px 12px;border:1px solid #d8ccb4;border-radius:10px;font:inherit;background:#fffdf8}
textarea{min-height:64px;resize:vertical}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
@media(max-width:600px){.grid{grid-template-columns:1fr}}
.notice{display:flex;gap:10px;background:var(--cream);border-left:4px solid var(--olive);padding:12px 14px;border-radius:10px;font-size:14px}
.notice i{color:var(--olive);margin-top:4px}
.drop{border:2px dashed #cdbf9f;border-radius:14px;padding:26px;text-align:center;cursor:pointer;background:#fffdf8;transition:.2s}
.drop:hover,.drop.over{border-color:var(--navy);background:#f3efe4}
.drop i{font-size:34px;color:var(--gold)}
.photo{display:grid;grid-template-columns:120px 1fr;gap:14px;border-top:1px dashed var(--line);padding-top:14px;margin-top:14px}
.photo img{width:120px;height:120px;object-fit:cover;border-radius:10px;border:1px solid var(--line)}
.photo .rm{background:none;border:0;color:#a33;cursor:pointer;font:inherit;font-size:13px;padding:0;margin-top:6px}
@media(max-width:600px){.photo{grid-template-columns:1fr}.photo img{width:100%;height:200px}}
.consent{display:flex;gap:10px;align-items:flex-start;font-size:14px}
.consent input{margin-top:5px;width:18px;height:18px}
button.go{background:var(--navy);color:#fff;border:0;border-radius:999px;padding:14px 26px;font:600 16px Lora,serif;cursor:pointer;display:inline-flex;gap:10px;align-items:center}
button.go:disabled{opacity:.5;cursor:default}
.bar{height:10px;background:#eee4cf;border-radius:10px;overflow:hidden;margin:14px 0 6px}
.bar div{height:100%;width:0;background:linear-gradient(90deg,var(--olive),var(--gold));transition:width .3s}
.err{color:#a33;font-size:14px;margin-top:8px}
.done{text-align:center;padding:40px 20px}
.done i{font-size:48px;color:var(--olive)}
</style></head><body>
<div class="top">
  <div class="eyebrow"><i class="fa-solid fa-camera"></i> &nbsp;Share family photos</div>
  <h1>Greeks of the Riverland</h1>
  <div>Send up to <?= maxPhotos ?> photographs — no Google account needed.</div>
  <div style="margin-top:10px"><a href="<?= siteUrl ?>"><i class="fa-solid fa-arrow-left"></i> Back to the website</a></div>
</div>
<div class="wrap" id="app">
  <div class="card">
    <h2>About you</h2>
    <div class="grid">
      <div><label>Your name *</label><input type="text" id="name" autocomplete="name"></div>
      <div><label>Your relationship to the family *</label><input type="text" id="relationship" placeholder="e.g. daughter, grandson, friend"></div>
      <div><label>Email *</label><input type="email" id="email" autocomplete="email"></div>
      <div><label>Phone <small>(optional)</small></label><input type="tel" id="phone" autocomplete="tel"></div>
      <div><label>Family surname *</label><input type="text" id="surname" placeholder="e.g. Savaidis"></div>
      <div><label>Riverland town <small>(optional)</small></label>
        <select id="town"><option value=""></option><option>Barmera</option><option>Berri</option><option>Blanchetown</option><option>Cobdogla</option><option>Glossop</option><option>Loveday</option><option>Loxton</option><option>Monash</option><option>Morgan</option><option>Paringa</option><option>Renmark</option><option>Waikerie</option><option>Other</option></select></div>
    </div>
    <label class="consent" style="font-weight:400;color:inherit;margin-top:14px"><input type="checkbox" id="contact" checked> You may contact me about these photos.</label>
  </div>

  <div class="card">
    <h2>Your photographs</h2>
    <div class="drop" id="drop"><i class="fa-solid fa-images"></i><div><b>Tap to choose photos</b> or drag them here</div><div style="font-size:13px;color:var(--muted)">Up to <?= maxPhotos ?> photos · JPG or PNG</div></div>
    <input type="file" id="files" accept="image/*" multiple hidden>
    <div id="list"></div>
  </div>

  <div class="card">
    <label class="consent" style="font-weight:400;color:inherit;margin:0"><input type="checkbox" id="consent">
      <span><b>Consent *</b> — I confirm these photographs and details may be considered for publication on the Greeks of the Riverland website. I understand every submission is reviewed first and my contact details will never be published.</span></label>
    <div class="notice" style="margin-top:14px"><i class="fa-solid fa-lock"></i><div>Your photos go privately to the project team. Nothing appears on the website automatically.</div></div>
    <div class="bar" id="barWrap" style="display:none"><div id="bar"></div></div>
    <div id="status" style="font-size:14px;color:var(--muted)"></div>
    <div class="err" id="err"></div>
    <div style="margin-top:16px"><button class="go" id="send"><i class="fa-solid fa-paper-plane"></i> Send photos</button></div>
  </div>
</div>
<script>
const MAX=<?= maxPhotos ?>; let photos=[];
const $=id=>document.getElementById(id);
$('drop').onclick=()=>$('files').click();
['dragover','dragenter'].forEach(ev=>$('drop').addEventListener(ev,e=>{e.preventDefault();$('drop').classList.add('over')}));
['dragleave','drop'].forEach(ev=>$('drop').addEventListener(ev,e=>{e.preventDefault();$('drop').classList.remove('over')}));
$('drop').addEventListener('drop',e=>addFiles(e.dataTransfer.files));
$('files').onchange=e=>{addFiles(e.target.files);e.target.value=''};
function addFiles(fl){[...fl].forEach(f=>{if(!/^image\//.test(f.type)&&!/\.(jpe?g|png|heic|webp)$/i.test(f.name))return;if(photos.length>=MAX){$('err').textContent='You can send up to '+MAX+' photos at a time.';return;}photos.push({file:f,url:URL.createObjectURL(f),people:'',year:'',place:'',description:''});});render();}
function render(){$('list').innerHTML=photos.map((p,i)=>'<div class="photo"><div><img src="'+p.url+'" alt=""><button class="rm" onclick="rm('+i+')"><i class="fa-solid fa-xmark"></i> Remove</button></div><div>'+
 '<label>Who is in the photo?</label><input type="text" data-i="'+i+'" data-k="people" value="'+esc(p.people)+'" placeholder="Names, left to right if you know them">'+
 '<div class="grid"><div><label>Approximate year</label><input type="text" data-i="'+i+'" data-k="year" value="'+esc(p.year)+'" placeholder="e.g. 1965"></div><div><label>Place</label><input type="text" data-i="'+i+'" data-k="place" value="'+esc(p.place)+'" placeholder="e.g. Monash packing shed"></div></div>'+
 '<label>Short description</label><textarea data-i="'+i+'" data-k="description" placeholder="What was happening?">'+esc(p.description)+'</textarea></div></div>').join('');
 document.querySelectorAll('[data-i]').forEach(el=>el.oninput=()=>{photos[+el.dataset.i][el.dataset.k]=el.value});}
function rm(i){photos.splice(i,1);render();}
function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function shrink(file){return new Promise(res=>{const img=new Image();img.onload=()=>{const M=2400;let w=img.naturalWidth,h=img.naturalHeight;const s=Math.min(1,M/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(h*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);res({data:c.toDataURL('image/jpeg',0.88).split(',')[1],type:'image/jpeg',filename:file.name.replace(/\.[^.]+$/,'')+'.jpg'});};
 img.onerror=()=>{const r=new FileReader();r.onload=()=>res({data:String(r.result).split(',')[1],type:file.type||'image/jpeg',filename:file.name});r.readAsDataURL(file);};img.src=URL.createObjectURL(file);});}
function call(fn,...a){return new Promise((ok,bad)=>google.script.run.withSuccessHandler(ok).withFailureHandler(bad)[fn](...a));}
$('send').onclick=async()=>{
 $('err').textContent='';
 const meta={name:$('name').value.trim(),relationship:$('relationship').value.trim(),email:$('email').value.trim(),phone:$('phone').value.trim(),surname:$('surname').value.trim(),town:$('town').value,contact:$('contact').checked,consent:$('consent').checked};
 if(!meta.name||!meta.relationship||!meta.email||!meta.surname){$('err').textContent='Please fill in the fields marked *.';return;}
 if(!photos.length){$('err').textContent='Please choose at least one photo.';return;}
 if(!meta.consent){$('err').textContent='Please tick the consent box.';return;}
 $('send').disabled=true;$('barWrap').style.display='block';
 try{
  $('status').textContent='Preparing…';const folderId=await call('startUpload',meta);
  for(let i=0;i<photos.length;i++){$('status').textContent='Sending photo '+(i+1)+' of '+photos.length+'…';const s=await shrink(photos[i].file);
   await call('uploadPhoto',folderId,Object.assign(s,{people:photos[i].people,year:photos[i].year,place:photos[i].place,description:photos[i].description}));
   $('bar').style.width=Math.round((i+1)/photos.length*100)+'%';}
  await call('finishUpload',folderId,meta,photos.map(p=>({people:p.people,year:p.year,place:p.place,description:p.description})));
  $('app').innerHTML='<div class="card done"><i class="fa-solid fa-circle-check"></i><h2 style="margin-top:12px">Thank you!</h2><p>Your photographs have been received and will be reviewed before anything is published.</p><p><a href="<?= siteUrl ?>">Back to Greeks of the Riverland</a></p></div>';
 }catch(e){$('err').textContent='Sorry — something went wrong: '+(e&&e.message?e.message:e)+'. Please try again.';$('send').disabled=false;}
};
</script></body></html>`;

/* ====================== INTERACTIVE TOWNS MAP ====================== */
/*
 * The map on the website (Towns page and homepage) is this web app with ?page=map.
 * Families shown on the map come from the "Map Families" tab in the submissions Sheet:
 *   Town | Family surname | Family page (link) | Show on map (Yes/No) | Notes
 * Add a row there when a family page is published — the map updates on the next page load.
 */
const MAP_TOWNS = ['Morgan','Cadell','Ramco','Waikerie','Blanchetown','Woolpunda','Overland Corner','Kingston-on-Murray',
  'Cobdogla','Moorook','Barmera','Loveday','Cooltong','Monash','Glossop','Berri','Lyrup','Winkie','Loxton','Pyap','Renmark','Paringa'];
const MAP_IMAGE_SOURCE = 'https://raw.githubusercontent.com/josephsismart/greeks-riverland/main/public/m/riverland-towns-map.jpg';

/** One-time: copy the map picture into Drive and create the "Map Families" tab. Safe to run again. */
function setupMap() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('MAP_IMAGE_ID');
  if (!id) {
    const folder = getOrCreate_(DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID), 'Website Assets');
    const blob = UrlFetchApp.fetch(MAP_IMAGE_SOURCE).getBlob().setName('Riverland Towns Map.jpg');
    id = folder.createFile(blob).getId();
    props.setProperty('MAP_IMAGE_ID', id);
  }
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sh = ss.getSheetByName('Map Families');
  if (!sh) {
    sh = ss.insertSheet('Map Families');
    sh.getRange(1, 1, 1, 5).setValues([['Town', 'Family surname', 'Family page (link)', 'Show on map', 'Notes']])
      .setFontWeight('bold').setBackground('#1b365d').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange(2, 1, 1, 5).setValues([['Monash', 'Savaidis', CONFIG.SITE_URL + '/families/savaidis-family', 'Yes', 'Sample family page']]);
    sh.setColumnWidth(1, 160); sh.setColumnWidth(2, 170); sh.setColumnWidth(3, 420); sh.setColumnWidth(4, 110); sh.setColumnWidth(5, 260);
  }
  if (!String(sh.getRange(1, 6).getValue()).trim()) {
    sh.getRange(1, 6).setValue('Detail on town page (optional)').setFontWeight('bold').setBackground('#1b365d').setFontColor('#ffffff');
    sh.setColumnWidth(6, 320);
  }
  sh.getRange('A2:A1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(MAP_TOWNS, true).setAllowInvalid(false).build());
  sh.getRange('D2:D1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).build());
  return 'Map ready. Image id ' + id + '. Map link: ' + CONFIG.UPLOAD_URL + '?page=map';
}

function mapFamilies_() {
  const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName('Map Families');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues()
    .filter(function (r) { return r[0] && r[1] && String(r[3]).toLowerCase() !== 'no'; })
    .map(function (r) { return { town: String(r[0]).trim(), family: String(r[1]).trim(), url: String(r[2]).trim(), detail: String(r[5] || '').trim() }; });
}

function mapPage_() {
  const id = PropertiesService.getScriptProperties().getProperty('MAP_IMAGE_ID');
  let img = MAP_IMAGE_SOURCE;
  if (id) {
    img = 'data:image/jpeg;base64,' + Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes());
  }
  const data = JSON.stringify({ families: mapFamilies_() }).replace(/</g, '\\u003c');
  const html = MAP_HTML.replace('__IMG__', function () { return img; }).replace('__DATA__', function () { return data; });
  return HtmlService.createHtmlOutput(html)
    .setTitle('Riverland Towns — Greeks of the Riverland')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

const MAP_HTML = String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<base target="_top">
<title>Riverland Towns – Greeks of the Riverland</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fbf7ec;font-family:'Source Sans 3',Arial,sans-serif;color:#1b2a3a}
.wrap{position:relative;width:100%;max-width:1402px;margin:0 auto;aspect-ratio:1402/1122;overflow:hidden}
svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.hit{fill:transparent;cursor:pointer}
.ring{fill:none;stroke:#c5a059;stroke-width:5;opacity:0;transition:opacity .15s}
.town.on .ring,.town:hover .ring{opacity:1}
.town:focus{outline:none}
.badge circle{fill:#b85d39;stroke:#fff;stroke-width:2.5}
.badge text{fill:#fff;font:700 15px 'Source Sans 3',Arial,sans-serif;text-anchor:middle;dominant-baseline:central;pointer-events:none}
.hint{font:600 22px 'Source Sans 3',Arial,sans-serif;fill:#1b365d}
.hint2{font:400 18px 'Source Sans 3',Arial,sans-serif;fill:#5f5b53}
.card{position:absolute;z-index:5;min-width:210px;max-width:300px;background:#fff;border:1px solid #e2dcd0;border-top:4px solid #1b365d;border-radius:10px;box-shadow:0 10px 30px rgba(20,30,50,.22);padding:12px 14px 12px;display:none;font-size:14px}
.card.show{display:block}
.card h3{font-family:'Playfair Display',Georgia,serif;font-size:19px;color:#1b365d;line-height:1.15;padding-right:22px}
.card .sub{font-size:12px;color:#7a7368;text-transform:uppercase;letter-spacing:.08em;margin-top:2px}
.card ul{list-style:none;margin:8px 0 6px;max-height:190px;overflow:auto}
.card li a{display:flex;justify-content:space-between;gap:10px;padding:6px 8px;margin:0 -8px;border-radius:6px;color:#1b365d;text-decoration:none;font-weight:600}
.card li a:hover{background:#f3efe6}
.card li a span{color:#b85d39}
.card .none{color:#5f5b53;margin:8px 0;line-height:1.35}
.card .foot{border-top:1px solid #eee7da;margin-top:6px;padding-top:7px;display:flex;flex-wrap:wrap;gap:4px 14px}
.card .foot a{color:#b85d39;font-weight:700;text-decoration:none;font-size:13px}
.card .x{position:absolute;right:8px;top:6px;border:0;background:none;font-size:20px;color:#7a7368;cursor:pointer;line-height:1}
@media (max-width:600px){.card{font-size:13px;min-width:180px;max-width:240px;padding:10px 11px}.card h3{font-size:17px}}
</style></head><body>
<div class="wrap" id="wrap">
<svg viewBox="0 0 1402 1122" id="map" aria-label="Interactive map of Riverland towns">
  <image href="__IMG__" x="0" y="0" width="1402" height="1122"/>
  <g id="hintg"><text class="hint" x="1000" y="1010" text-anchor="middle">Hover or tap a town to see its families</text>
  <text class="hint2" x="1000" y="1040" text-anchor="middle">Click a family name to open their page</text></g>
  <g id="towns"></g>
</svg>
<div class="card" id="card" role="dialog" aria-live="polite"></div>
</div>
<script>
var DATA = __DATA__;
var SITE='https://sites.google.com/view/greeksoftheriverland/';
// x,y = dot centre; w = width of clickable label area to the right (negative = label on the left); major = big green dot
var TOWNS=[
 ['Morgan',57,289,120],['Cadell',189,325,90],['Ramco',291,437,-95],['Waikerie',369,465,175,1],['Blanchetown',75,573,160],
 ['Woolpunda',443,598,130],['Overland Corner',632,428,190],['Kingston-on-Murray',511,551,215],['Cobdogla',662,627,120],
 ['Moorook',632,717,115],['Barmera',782,599,155,1],['Loveday',784,691,105],['Cooltong',1032,377,110],['Monash',965,528,100],
 ['Glossop',924,580,100],['Berri',1023,618,105,1],['Lyrup',1118,580,80],['Winkie',930,762,90],['Loxton',1050,791,135,1],
 ['Pyap',1195,751,75],['Renmark',1219,499,155,1],['Paringa',1299,534,95]];
var TOWN_PAGES={Berri:'towns/berri',Renmark:'towns/renmark',Barmera:'towns/barmera',Monash:'towns/monash',Loxton:'towns/loxton',Paringa:'towns/paringa'};
var ADD=SITE+'add-your-family', OTHER=SITE+'towns/surrounding-districts';
function fams(t){return (DATA.families||[]).filter(function(f){return norm(f.town)===norm(t)}).sort(function(a,b){return a.family.localeCompare(b.family)})}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z]/g,'')}
function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function url(u){u=String(u||'').trim();if(!u)return '';if(/^https?:\/\//.test(u))return u;return SITE+u.replace(/^\//,'')}
var NS='http://www.w3.org/2000/svg',g=document.getElementById('towns'),card=document.getElementById('card'),wrap=document.getElementById('wrap'),pinned=null;
function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);(p||g).appendChild(e);return e}
TOWNS.forEach(function(t){
  var name=t[0],x=t[1],y=t[2],w=t[3],major=t[4],r=major?22:14;
  var grp=el('g',{'class':'town','tabindex':'0','role':'button','aria-label':name});grp.dataset.town=name;
  el('circle',{'class':'ring',cx:x,cy:y,r:r+7},grp);
  var x0=w<0?x+w-12:x-r-6, ww=Math.abs(w)+r+18;
  el('rect',{'class':'hit',x:x0,y:y-(major?26:20),width:ww,height:major?52:40,rx:12},grp);
  var n=fams(name).length;
  if(n){var b=el('g',{'class':'badge'},grp);el('circle',{cx:x+r*0.75,cy:y-r*0.85,r:12},b);var tx=el('text',{x:x+r*0.75,y:y-r*0.85+1},b);tx.textContent=n;}
  grp.addEventListener('mouseenter',function(){clearTimeout(hideT);if(!pinned)show(grp)});
  grp.addEventListener('mouseleave',function(){if(!pinned)hideT=setTimeout(function(){if(!pinned&&!overCard)hide()},350)});
  grp.addEventListener('click',function(e){e.stopPropagation();if(pinned===grp){pinned=null;hide();return}pinned=grp;show(grp)});
  grp.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pinned=grp;show(grp)}});
});
var hideT=null,overCard=false;
card.addEventListener('mouseenter',function(){overCard=true;clearTimeout(hideT)});
card.addEventListener('mouseleave',function(){overCard=false;if(!pinned)hideT=setTimeout(function(){if(!pinned&&!overCard)hide()},250)});
document.addEventListener('click',function(e){if(!card.contains(e.target)){pinned=null;hide()}});
var cur=null;
function show(grp){
  if(cur&&cur!==grp)cur.classList.remove('on');cur=grp;grp.classList.add('on');
  var name=grp.dataset.town,list=fams(name),tp=TOWN_PAGES[name]?SITE+TOWN_PAGES[name]:OTHER;
  var h='<button class="x" aria-label="Close" onclick="event.stopPropagation();pinned=null;hide()">&times;</button><h3>'+esc(name)+'</h3><div class="sub">'+(list.length?list.length+(list.length>1?' families':' family'):'Riverland town')+'</div>';
  if(list.length){h+='<ul>'+list.map(function(f){var u=url(f.url);return '<li>'+(u?'<a href="'+esc(u)+'" target="_top">'+esc(f.family)+' family <span>&rarr;</span></a>':'<a>'+esc(f.family)+' family</a>')+'</li>'}).join('')+'</ul>'}
  else h+='<p class="none">No families recorded here yet. Did your family live in '+esc(name)+'?</p>';
  h+='<div class="foot"><a href="'+tp+'" target="_top">'+(TOWN_PAGES[name]?'About '+esc(name)+' &rarr;':'Surrounding districts &rarr;')+'</a><a href="'+ADD+'" target="_top">Add your family &rarr;</a></div>';
  card.innerHTML=h;card.classList.add('show');place(grp);
}
function hide(){card.classList.remove('show');if(cur){cur.classList.remove('on');cur=null}}
function place(grp){
  var t=TOWNS.filter(function(z){return z[0]===grp.dataset.town})[0],W=wrap.clientWidth,H=wrap.clientHeight,s=W/1402;
  var px=t[1]*s,py=t[2]*s,cw=card.offsetWidth,ch=card.offsetHeight,gap=18,r=(t[4]?22:14)*s,lw=Math.abs(t[3])*s;
  var right=(t[3]>0?px+r+lw:px+r)+gap, leftSide=(t[3]<0?px-r-lw:px-r)-gap-cw;
  var left=right, top=py-ch/2;
  if(left+cw>W-6)left=leftSide;
  if(left<6){left=Math.max(6,Math.min(W-cw-6,px-cw/2));top=py+r+gap; if(top+ch>H-6)top=py-r-gap-ch;}
  top=Math.max(6,Math.min(H-ch-6,top));
  card.style.left=left+'px';card.style.top=top+'px';
}
window.addEventListener('resize',function(){if(cur)place(cur)});
</script>
</body></html>
`;
/**
 * Greeks of the Riverland — "Add Your Family" Form + Family Register
 * ------------------------------------------------------------------
 * rebuildForm()      Rebuilds the Google Form to match the approved questionnaire
 *                    (same Form, same link — the website embed keeps working).
 * setupRegister()    Creates the "Family Register" tab: one row per family submission,
 *                    colour-coded in four groups (Family details · Story/history ·
 *                    Permissions/privacy · Project administration).
 * onFamilySubmit(e)  Trigger: every new Form submission becomes a Register row with a
 *                    GOR-0001 style ID and its own Drive folder, then emails the admins.
 *
 * Run once, in this order:  rebuildForm()  →  setupRegister()
 */

const REG = {
  TAB: 'Family Register',
  RAW_TAB: 'Form Responses (raw)',
  FAMILY_FOLDER: 'Family Submissions',
  TOWNS: ['Barmera', 'Berri', 'Blanchetown', 'Cobdogla', 'Glossop', 'Loveday', 'Loxton', 'Monash', 'Morgan', 'Paringa', 'Renmark', 'Waikerie'],
  PERM: [
    'I give Greeks of the Riverland permission to use the family history information I have provided on the Greeks of the Riverland website and project.',
    'If I have uploaded photographs or documents, I give permission for them to be displayed as part of the project.',
    'I understand that my email address and phone number will not be published.',
    'I understand that the wording may be lightly edited for spelling, grammar and clarity before publication.'
  ]
};

/* Question titles (used to read answers back). */
const Q = {
  name: 'Your name',
  email: 'Email address',
  phone: 'Phone number',
  connection: 'What is your connection to the family?',
  mayContact: 'May we contact you if we have a question about your submission?',
  surname: 'Family surname',
  spellings: 'Was the surname ever spelt differently or known by another spelling?',
  towns: 'Which Riverland towns or areas was the family connected with?',
  firstYear: 'About what year did the family first come to the Riverland?',
  lastYear: 'About what year did the family leave the Riverland?',
  moved: 'If the family lived in more than one Riverland town or property, please tell us about it.',
  origin: 'What town, village or area did the family come from before settling in Australia?',
  country: 'Country',
  arrived: 'About what year did the family arrive in Australia?',
  before: 'Did they live somewhere else in Australia before coming to the Riverland?',
  people: 'Please tell us the names of the family members you would like included in the story.',
  work: 'What work did members of the family do?',
  business: 'Did the family own or operate a business?',
  businessAbout: 'If yes, please tell us about it.',
  community: 'Was the family involved in church, schools, sporting clubs, Greek organisations or other community activities?',
  story: "Please tell us about your family's life in the Riverland.",
  memory: 'Is there a particular memory, person or story that you especially want remembered?',
  wantsUpload: 'Would you like to upload photographs or documents?',
  photoWho: 'Who or what is shown?',
  photoYear: 'About what year was it taken or created?',
  photoWhere: 'Where was it taken?',
  photoStory: 'Is there a story connected with it?',
  anything: 'Is there anything else about the family that you think should be remembered?',
  notPublish: 'Is there anything in your submission that you would prefer us not to publish?',
  perms: 'Before submitting, please confirm:',
  confirmName: 'Your name (to confirm)'
};

/* ============================ FORM ============================ */

const FORM_DESCRIPTION =
  'Every Greek family connected with the Riverland has a story.\n\n' +
  'We would love your help in preserving those stories — the people, places, work, friendships, photographs and memories that formed part of Greek life in the Riverland.\n\n' +
  'You do not need to know exact dates or have all the answers. Please share whatever you know. You can write as much or as little as you like.\n\n' +
  'Your personal contact details will not be published.\n\n' +
  '—\n\n' +
  'Your Family\'s Story, Shared With Care\n\n' +
  'Greeks of the Riverland is about preserving our community\'s history while respecting the people and families who are part of it.\n\n' +
  'Please only share information and photographs that you are comfortable contributing and have the right to share. We will avoid publishing sensitive personal information about living people.\n\n' +
  'Material submitted through this form will be kept securely and will not automatically be made public.\n\n' +
  'If you or a family member ever want something corrected, updated or removed, please contact us and we will review the request with care.';

function rebuildForm() {
  const form = FormApp.openById(CONFIG.FORM_ID);
  form.getItems().forEach(function (it) { form.deleteItem(it); });

  form.setTitle('Add Your Family — Greeks of the Riverland')
    .setDescription(FORM_DESCRIPTION)
    .setConfirmationMessage(
      'Thank you for helping preserve the story of Greeks in the Riverland.\n\n' +
      'Every contribution — whether it is a detailed family history, a few memories or a single old photograph — helps build a fuller picture of this community and its history.')
    .setCollectEmail(false)
    .setAllowResponseEdits(false)
    .setLimitOneResponsePerUser(false)
    .setProgressBar(true)
    .setShowLinkToRespondAgain(true);
  try { form.setRequireLogin(false); } catch (e) {}

  const text = function (title, help, required) {
    const it = form.addTextItem().setTitle(title).setRequired(!!required);
    if (help) it.setHelpText(help);
    return it;
  };
  const para = function (title, help, required) {
    const it = form.addParagraphTextItem().setTitle(title).setRequired(!!required);
    if (help) it.setHelpText(help);
    return it;
  };
  const yesNo = function (title, help) {
    const it = form.addMultipleChoiceItem().setTitle(title).setChoiceValues(['Yes', 'No']);
    if (help) it.setHelpText(help);
    return it;
  };
  const page = function (title, help) {
    const p = form.addPageBreakItem().setTitle(title);
    if (help) p.setHelpText(help);
    return p;
  };

  // 1. About You (first section = form header)
  form.addSectionHeaderItem().setTitle('1. About You');
  text(Q.name, '', true);
  text(Q.email, '', true).setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  text(Q.phone, 'Optional');
  text(Q.connection, 'For example: daughter, son, grandchild, cousin, family friend.');
  yesNo(Q.mayContact);

  // 2. About the Family
  page('2. About the Family');
  text(Q.surname, '', true);
  text(Q.spellings, 'Optional');
  form.addCheckboxItem().setTitle(Q.towns).setHelpText('Choose as many as needed.')
    .setChoiceValues(REG.TOWNS).showOtherOption(true);
  text(Q.firstYear, 'An approximate year is fine.');
  text(Q.lastYear, 'Leave blank if family members still live there.');
  para(Q.moved, 'Optional');

  // 3. Where Did the Family Come From?
  page('3. Where Did the Family Come From?');
  text(Q.origin);
  text(Q.country);
  text(Q.arrived, 'If known.');
  para(Q.before, 'Optional');

  // 4. The People in Your Family
  page('4. The People in Your Family');
  para(Q.people,
    'You can include whatever you know, for example:\n\n' +
    'George Papadopoulos – father – born 1928 – deceased 1998\n' +
    'Maria Papadopoulos – mother – born 1933\n' +
    'Nick Papadopoulos – son\n' +
    'Helen Papadopoulos – daughter\n\n' +
    'Exact birth and death dates are not necessary. You may also include nicknames or names people were commonly known by.');

  // 5. Life in the Riverland
  page('5. Life in the Riverland');
  para(Q.work, 'For example: fruit growing, packing sheds, wineries, shops, businesses, factories, trades or other work.');
  yesNo(Q.business);
  para(Q.businessAbout);
  para(Q.community, 'Tell us anything you remember.');

  // 6. Your Family Story
  page('6. Your Family Story', 'This is the part we would most love to hear.');
  para(Q.story,
    'You might like to tell us about:\n' +
    '• Why they came to the Riverland\n• Where they lived\n• Their work or business\n• School life\n' +
    '• Friendships and neighbours\n• The Greek community\n• Church and celebrations\n• Difficult times\n' +
    '• Funny or happy memories\n• What it was like growing up there\n• Why the family eventually left, if they did\n\n' +
    "Don't worry about spelling or writing style. You don't need to write a formal history — just tell the story in your own words. " +
    'We can help tidy the wording before anything is published.');
  para(Q.memory, 'Optional');

  // 7. Photographs and Documents
  const p7 = page('7. Photographs and Documents', 'Old photographs are an important part of this project.');
  const wants = yesNo(Q.wantsUpload);

  const p7b = page('Upload your photographs and documents',
    'Please open our photo upload page in a new tab — no Google account is needed:\n' + CONFIG.UPLOAD_URL + '\n\n' +
    'You can upload family photographs, school photographs, newspaper clippings, letters, certificates or other historical material. ' +
    'Use the same family surname and email address as on this form so we can match them together.\n\n' +
    'Then come back to this tab and tell us whatever you know about what you uploaded. It is completely fine if you don\'t know all the details.');
  para(Q.photoWho);
  text(Q.photoYear);
  text(Q.photoWhere);
  para(Q.photoStory);

  // 8. Anything Else?
  const p8 = page('8. Anything Else?');
  para(Q.anything, 'Optional');
  para(Q.notPublish, 'Optional');

  // 9. Permission
  page('9. Permission', 'Please avoid including private or sensitive information about living people unless they are comfortable with it being shared.');
  form.addCheckboxItem().setTitle(Q.perms).setChoiceValues(REG.PERM).setRequired(true)
    .setValidation(FormApp.createCheckboxValidation().requireSelectAtLeast(1).build());
  text(Q.confirmName, '', true);

  // Yes → upload page, No → skip to section 8
  wants.setChoices([wants.createChoice('Yes', p7b), wants.createChoice('No', p8)]);
  p7b.setGoToPage(p8);

  return 'Form rebuilt: ' + form.getItems().length + ' items · ' + form.getPublishedUrl();
}

/**
 * Safe update of the live Form WITHOUT deleting questions (keeps every past response linked):
 * refreshes the description (privacy text), the Riverland towns list and the upload-page link.
 */
function updateFormInPlace() {
  const form = FormApp.openById(CONFIG.FORM_ID);
  form.setDescription(FORM_DESCRIPTION);
  const out = ['Description updated'];
  form.getItems(FormApp.ItemType.CHECKBOX).forEach(function (it) {
    if (it.getTitle() === Q.towns) { it.asCheckboxItem().setChoiceValues(REG.TOWNS).showOtherOption(true); out.push('Towns: ' + REG.TOWNS.length); }
  });
  form.getItems(FormApp.ItemType.PAGE_BREAK).forEach(function (it) {
    if (it.getTitle() === 'Upload your photographs and documents') {
      it.asPageBreakItem().setHelpText(
        'Please open our photo upload page in a new tab — no Google account is needed:\n' + CONFIG.UPLOAD_URL + '\n\n' +
        'You can upload family photographs, school photographs, newspaper clippings, letters, certificates or other historical material. ' +
        'Use the same family surname and email address as on this form so we can match them together.\n\n' +
        'Then come back to this tab and tell us whatever you know about what you uploaded. It is completely fine if you don\'t know all the details.');
      out.push('Upload link refreshed');
    }
  });
  return out.join(' · ');
}

/* ========================== REGISTER ========================== */

const REG_GROUPS = [
  { name: 'FAMILY DETAILS', head: '#1F3A5F', band: '#DCE7F5', cols: [
    'Submission ID', 'Date Submitted', 'Family Surname', 'Other Surname Spellings', 'Family Branch / Distinction',
    'Riverland Towns / Areas', 'First Year in Riverland', 'Last Year in Riverland', 'Moved Within Riverland?', 'Movement Notes',
    'Place of Origin', 'Region / Country', 'Year Arrived in Australia', 'Previous Australian Location',
    'Family Members Summary', 'Deceased Family Members'] },
  { name: 'STORY / HISTORY', head: '#5E6B3A', band: '#E8EDDC', cols: [
    'Work / Occupations', 'Family Business', 'Community Involvement', 'Family Story', 'Important Memory / Story',
    'Anything Else to Remember', 'Photos / Documents Supplied', 'Photo / Document Notes', 'Drive Folder Link'] },
  { name: 'PERMISSIONS / PRIVACY  (private columns are never shown on the website)', head: '#8A3B2E', band: '#F4E1DC', cols: [
    'Permission to Publish', 'Photo Permission', 'Privacy Notes', 'Contributor Name', 'Contributor Connection',
    'Contributor Email (PRIVATE)', 'Contributor Phone (PRIVATE)', 'May Contact?'] },
  { name: 'PROJECT ADMINISTRATION', head: '#6B5A2E', band: '#F3ECD9', cols: [
    'Website Status', 'Website Page Link', 'Priority', 'Needs Editing', 'Needs Fact Check', 'Needs Photo Caption',
    'Ready to Publish', 'Follow-up Needed', 'Follow-up Notes', 'Last Reviewed', 'Reviewed By'] }
];

function regHeaders_() { return [].concat.apply([], REG_GROUPS.map(function (g) { return g.cols; })); }
function regCol_(name) { return regHeaders_().indexOf(name) + 1; }

function setupRegister() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const form = FormApp.openById(CONFIG.FORM_ID);

  // Fresh raw-responses tab linked to the rebuilt form (the old linked tab is removed if it holds no data).
  let oldLinked = null;
  ss.getSheets().forEach(function (s) { try { if (s.getFormUrl()) oldLinked = s; } catch (e) {} });
  try { form.removeDestination(); } catch (e) {}
  if (oldLinked && oldLinked.getLastRow() <= 1) { ss.deleteSheet(oldLinked); }
  else if (oldLinked) { oldLinked.setName('Old Form Responses (archive)'); }
  form.setDestination(FormApp.DestinationType.SPREADSHEET, CONFIG.SHEET_ID);
  SpreadsheetApp.flush();
  const ss2 = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  ss2.getSheets().forEach(function (s) {
    try { if (s.getFormUrl() && s.getName() !== REG.RAW_TAB) s.setName(REG.RAW_TAB); } catch (e) {}
  });

  // Register tab
  let sh = ss2.getSheetByName(REG.TAB);
  if (sh) ss2.deleteSheet(sh);
  sh = ss2.insertSheet(REG.TAB, 0);
  const headers = regHeaders_();
  sh.getRange(1, 1, 2, sh.getMaxColumns()).clear();
  if (sh.getMaxColumns() < headers.length) sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());

  let c = 1;
  REG_GROUPS.forEach(function (g) {
    const n = g.cols.length;
    sh.getRange(1, c, 1, n).merge().setValue(g.name).setBackground(g.head).setFontColor('#FFFFFF')
      .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('left');
    sh.getRange(2, c, 1, n).setValues([g.cols]).setBackground(g.head).setFontColor('#FFFFFF')
      .setFontWeight('bold').setWrap(true).setVerticalAlignment('middle');
    sh.getRange(3, c, 998, n).setBackground(g.band);
    c += n;
  });
  sh.setRowHeight(1, 28); sh.setRowHeight(2, 48);
  sh.setFrozenRows(2);
  sh.getRange(3, 1, 998, headers.length).setWrap(true).setVerticalAlignment('top');

  // Column widths
  headers.forEach(function (h, i) {
    const wide = ['Family Story', 'Family Members Summary', 'Important Memory / Story', 'Movement Notes', 'Photo / Document Notes',
      'Community Involvement', 'Work / Occupations', 'Anything Else to Remember', 'Privacy Notes', 'Follow-up Notes', 'Family Business'];
    sh.setColumnWidth(i + 1, wide.indexOf(h) >= 0 ? 320 : (h.length > 18 ? 160 : 120));
  });

  // Dropdowns
  const list = function (name, values) {
    sh.getRange(3, regCol_(name), 998, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build());
  };
  ['Moved Within Riverland?', 'Photos / Documents Supplied', 'Permission to Publish', 'Photo Permission', 'May Contact?',
    'Needs Editing', 'Needs Fact Check', 'Needs Photo Caption', 'Ready to Publish', 'Follow-up Needed'].forEach(function (n) { list(n, ['Yes', 'No']); });
  list('Website Status', ['Not reviewed', 'In progress', 'Published']);
  list('Priority', ['High', 'Normal', 'Low']);
  sh.getRange(3, regCol_('Last Reviewed'), 998, 1).setNumberFormat('d mmm yyyy');
  sh.getRange(3, regCol_('Date Submitted'), 998, 1).setNumberFormat('d mmm yyyy h:mm am/pm');

  // Status colours
  const st = sh.getRange(3, regCol_('Website Status'), 998, 1);
  const rules = [['Not reviewed', '#FFF4CC'], ['In progress', '#DCE7F5'], ['Published', '#C9DDB0']].map(function (p) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(p[0]).setBackground(p[1]).setBold(true).setRanges([st]).build();
  });
  const ready = sh.getRange(3, regCol_('Ready to Publish'), 998, 1);
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Yes').setBackground('#C9DDB0').setRanges([ready]).build());
  sh.setConditionalFormatRules(rules);

  // Private columns: note + protection warning
  ['Contributor Email (PRIVATE)', 'Contributor Phone (PRIVATE)'].forEach(function (n) {
    sh.getRange(2, regCol_(n)).setNote('Private — never display on the website.');
  });
  sh.getRange(2, regCol_('Submission ID')).setNote('Filled automatically: GOR-0001, GOR-0002 …');
  sh.getRange(2, regCol_('Website Status')).setNote('Only families marked "Published" appear in the website\'s Find a Family search.');

  // Hide the raw tab from day-to-day view and the superseded tabs
  const raw = ss2.getSheetByName(REG.RAW_TAB);
  if (raw) raw.hideSheet();
  ['Submissions', 'Sheet1'].forEach(function (n) {
    const s = ss2.getSheetByName(n);
    if (s && s.getLastRow() <= 1) { try { ss2.deleteSheet(s); } catch (e) {} }
  });
  ss2.setActiveSheet(sh);

  // Trigger
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['onFormSubmitNotify', 'onFamilySubmit'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFamilySubmit').forForm(CONFIG.FORM_ID).onFormSubmit().create();

  return 'Family Register ready (' + headers.length + ' columns). Trigger installed.';
}

/* ======================= ON SUBMIT ======================= */

function onFamilySubmit(e) {
  const a = {};
  e.response.getItemResponses().forEach(function (r) { a[r.getItem().getTitle()] = r.getResponse(); });
  const get = function (k) { const v = a[Q[k]]; return v == null ? '' : (Array.isArray(v) ? v.join(', ') : String(v).trim()); };

  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(REG.TAB);
    const id = nextId_(sh);
    const surname = get('surname');
    const folder = getOrCreate_(getOrCreate_(DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID), REG.FAMILY_FOLDER),
      id + ' — ' + clean_(surname) + ' — ' + clean_(get('name')));

    const perms = [].concat(a[Q.perms] || []);
    const people = get('people');
    const deceased = people.split(/\n/).filter(function (l) { return /deceased|died|passed|d\.\s?\d{4}|late /i.test(l); }).join('\n');
    const photoNotes = [['Who/what', get('photoWho')], ['Year', get('photoYear')], ['Where', get('photoWhere')], ['Story', get('photoStory')]]
      .filter(function (p) { return p[1]; }).map(function (p) { return p[0] + ': ' + p[1]; }).join('\n');

    const v = {
      'Submission ID': id,
      'Date Submitted': e.response.getTimestamp(),
      'Family Surname': surname,
      'Other Surname Spellings': get('spellings'),
      'Riverland Towns / Areas': get('towns'),
      'First Year in Riverland': get('firstYear'),
      'Last Year in Riverland': get('lastYear') || 'Still connected',
      'Moved Within Riverland?': get('moved') ? 'Yes' : 'No',
      'Movement Notes': get('moved'),
      'Place of Origin': get('origin'),
      'Region / Country': get('country'),
      'Year Arrived in Australia': get('arrived'),
      'Previous Australian Location': get('before'),
      'Family Members Summary': people,
      'Deceased Family Members': deceased,
      'Work / Occupations': get('work'),
      'Family Business': get('business') === 'Yes' ? (get('businessAbout') || 'Yes') : (get('business') || ''),
      'Community Involvement': get('community'),
      'Family Story': get('story'),
      'Important Memory / Story': get('memory'),
      'Anything Else to Remember': get('anything'),
      'Photos / Documents Supplied': get('wantsUpload') === 'Yes' ? 'Yes' : 'No',
      'Photo / Document Notes': photoNotes,
      'Drive Folder Link': folder.getUrl(),
      'Permission to Publish': perms.indexOf(REG.PERM[0]) >= 0 ? 'Yes' : 'No',
      'Photo Permission': perms.indexOf(REG.PERM[1]) >= 0 ? 'Yes' : 'No',
      'Privacy Notes': get('notPublish'),
      'Contributor Name': get('name'),
      'Contributor Connection': get('connection'),
      'Contributor Email (PRIVATE)': get('email'),
      'Contributor Phone (PRIVATE)': get('phone'),
      'May Contact?': get('mayContact'),
      'Website Status': 'Not reviewed',
      'Priority': 'Normal',
      'Needs Editing': 'Yes',
      'Needs Fact Check': 'Yes',
      'Needs Photo Caption': get('wantsUpload') === 'Yes' ? 'Yes' : 'No',
      'Ready to Publish': 'No',
      'Follow-up Needed': get('notPublish') ? 'Yes' : 'No'
    };
    const row = regHeaders_().map(function (h) { return v[h] === undefined ? '' : v[h]; });
    const r = Math.max(sh.getLastRow() + 1, 3);
    sh.getRange(r, 1, 1, row.length).setValues([row]);

    folder.createFile(id + ' — submission summary.txt', regHeaders_().filter(function (h) { return !/PRIVATE/.test(h) && v[h]; })
      .map(function (h) { return h + ':\n' + v[h] + '\n'; }).join('\n'), MimeType.PLAIN_TEXT);

    const sheetUrl = 'https://docs.google.com/spreadsheets/d/' + CONFIG.SHEET_ID + '/edit';
    MailApp.sendEmail({
      to: notifyEmails_(),
      subject: 'New family submission ' + id + ' — ' + (surname || '(no surname)') + ' (Greeks of the Riverland)',
      htmlBody: '<p><b>' + esc_(get('name')) + '</b>' + (get('connection') ? ' (' + esc_(get('connection')) + ')' : '') +
        ' submitted the <b>' + esc_(surname) + '</b> family' + (get('towns') ? ' — ' + esc_(get('towns')) : '') + '.</p>' +
        (get('wantsUpload') === 'Yes' ? '<p>They said they would upload photographs or documents.</p>' : '') +
        '<p>Nothing has been published. <a href="' + sheetUrl + '">Open the Family Register</a> · ' +
        '<a href="' + folder.getUrl() + '">Family folder</a></p>',
      name: 'Greeks of the Riverland'
    });
  } finally { lock.releaseLock(); }
}

function nextId_(sh) {
  const last = sh.getLastRow();
  let max = 0;
  if (last >= 3) sh.getRange(3, 1, last - 2, 1).getValues().forEach(function (r) {
    const m = String(r[0]).match(/GOR-(\d+)/); if (m) max = Math.max(max, +m[1]);
  });
  return 'GOR-' + ('000' + (max + 1)).slice(-4);
}

/** Called by the photo upload page: links the upload to the matching Register row (same surname + email). */
function linkUploadToRegister_(meta, uploadFolder, count) {
  try {
    const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(REG.TAB);
    if (!sh || sh.getLastRow() < 3) return;
    const data = sh.getRange(3, 1, sh.getLastRow() - 2, regHeaders_().length).getValues();
    const cS = regCol_('Family Surname') - 1, cE = regCol_('Contributor Email (PRIVATE)') - 1;
    for (let i = data.length - 1; i >= 0; i--) {
      if (String(data[i][cS]).trim().toLowerCase() === String(meta.surname).trim().toLowerCase() &&
          String(data[i][cE]).trim().toLowerCase() === String(meta.email).trim().toLowerCase()) {
        const r = i + 3;
        sh.getRange(r, regCol_('Photos / Documents Supplied')).setValue('Yes');
        const nc = sh.getRange(r, regCol_('Photo / Document Notes'));
        nc.setValue((nc.getValue() ? nc.getValue() + '\n' : '') + count + ' file(s) received via upload page: ' + uploadFolder.getUrl());
        sh.getRange(r, regCol_('Needs Photo Caption')).setValue('Yes');
        try {
          const link = String(data[i][regCol_('Drive Folder Link') - 1]);
          const m = link.match(/folders\/([\w-]+)/);
          if (m) uploadFolder.moveTo(DriveApp.getFolderById(m[1]));
        } catch (e) {}
        return data[i][0];
      }
    }
  } catch (e) {}
  return '';
}

/* ======================= END-TO-END TEST ======================= */
/*
 * testFormSubmission()    submits a real test response to the Form (surname "Zztest"), exactly like a visitor.
 *                         The onFamilySubmit trigger then adds it to the Family Register within a minute.
 * removeTestSubmissions() deletes the Zztest rows, their Form responses and their Drive folders.
 */
const TEST_SURNAME = 'Zztest';

function testFormSubmission() {
  const form = FormApp.openById(CONFIG.FORM_ID);
  const items = {};
  form.getItems().forEach(function (it) { items[it.getTitle()] = it; });
  const need = function (t) { if (!items[t]) throw new Error('Question not found: ' + t); return items[t]; };
  const r = form.createResponse();
  r.withItemResponse(need(Q.name).asTextItem().createResponse('TEST entry (automated check)'));
  r.withItemResponse(need(Q.email).asTextItem().createResponse('test@example.com'));
  r.withItemResponse(need(Q.connection).asTextItem().createResponse('Test only - please delete'));
  r.withItemResponse(need(Q.mayContact).asMultipleChoiceItem().createResponse('No'));
  r.withItemResponse(need(Q.surname).asTextItem().createResponse(TEST_SURNAME));
  r.withItemResponse(need(Q.towns).asCheckboxItem().createResponse(['Morgan', 'Glossop']));
  r.withItemResponse(need(Q.firstYear).asTextItem().createResponse('1955'));
  r.withItemResponse(need(Q.people).asParagraphTextItem().createResponse('Test Person - father - deceased 1990\nTest Child - daughter'));
  r.withItemResponse(need(Q.story).asParagraphTextItem().createResponse('Automated test of the Add Your Family form. Safe to delete.'));
  r.withItemResponse(need(Q.wantsUpload).asMultipleChoiceItem().createResponse('No'));
  r.withItemResponse(need(Q.perms).asCheckboxItem().createResponse(REG.PERM));
  r.withItemResponse(need(Q.confirmName).asTextItem().createResponse('TEST entry (automated check)'));
  r.submit();
  return 'Test response submitted. Check the Family Register for "' + TEST_SURNAME + '" in about a minute.';
}

function checkTestSubmission() {
  const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(REG.TAB);
  const H = regHeaders_();
  const rows = sh.getLastRow() < 3 ? [] : sh.getRange(3, 1, sh.getLastRow() - 2, H.length).getValues();
  const hit = rows.filter(function (r) { return r[H.indexOf('Family Surname')] === TEST_SURNAME; });
  const out = hit.length ? hit.map(function (r) {
    return ['ID ' + r[0], 'Towns: ' + r[H.indexOf('Riverland Towns / Areas')], 'Deceased: ' + r[H.indexOf('Deceased Family Members')],
      'Permission: ' + r[H.indexOf('Permission to Publish')], 'Status: ' + r[H.indexOf('Website Status')],
      'Folder: ' + (r[H.indexOf('Drive Folder Link')] ? 'yes' : 'MISSING')].join(' | ');
  }).join('\n') : 'No Zztest row yet';
  Logger.log(out);
  return out;
}

function removeTestSubmissions() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const H = regHeaders_();
  const out = [];
  const sh = ss.getSheetByName(REG.TAB);
  let n = 0;
  if (sh && sh.getLastRow() >= 3) {
    const rows = sh.getRange(3, 1, sh.getLastRow() - 2, H.length).getValues();
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i][H.indexOf('Family Surname')] !== TEST_SURNAME) continue;
      const m = String(rows[i][H.indexOf('Drive Folder Link')]).match(/folders\/([\w-]+)/);
      if (m) { try { DriveApp.getFolderById(m[1]).setTrashed(true); } catch (e) {} }
      sh.deleteRow(i + 3); n++;
    }
  }
  out.push('Register rows removed: ' + n);
  const form = FormApp.openById(CONFIG.FORM_ID);
  let k = 0;
  form.getResponses().forEach(function (resp) {
    const isTest = resp.getItemResponses().some(function (ir) { return ir.getItem().getTitle() === Q.surname && ir.getResponse() === TEST_SURNAME; });
    if (isTest) { form.deleteResponse(resp.getId()); k++; }
  });
  out.push('Form responses removed: ' + k);
  const raw = ss.getSheetByName(REG.RAW_TAB);
  let j = 0;
  if (raw && raw.getLastRow() >= 2) {
    const head = raw.getRange(1, 1, 1, raw.getLastColumn()).getValues()[0];
    const c = head.indexOf(Q.surname);
    if (c >= 0) {
      const vals = raw.getRange(2, c + 1, raw.getLastRow() - 1, 1).getValues();
      for (let i = vals.length - 1; i >= 0; i--) if (vals[i][0] === TEST_SURNAME) { raw.deleteRow(i + 2); j++; }
    }
  }
  out.push('Raw response rows removed: ' + j);
  Logger.log(out.join('\n'));
  return out.join('\n');
}
/**
 * Greeks of the Riverland — homepage widgets (served by the same web app)
 *   ?page=map   Geographically accurate Riverland map (OpenStreetMap data). Click a town → its page.
 *   ?page=find  Find a Family: surname search + A–Z, from published families only.
 *   ?page=town&t=Berri  Families of one town (embedded on each town page).
 *
 * Town positions are the official OpenStreetMap / Nominatim coordinates (checked 3 Oct 2026).
 * To add a town later: add a line to RIVERLAND_TOWNS (name, lat, lng, page path).
 */

const RIVERLAND_TOWNS = [
  { name: 'Blanchetown', lat: -34.3517492, lng: 139.6117093, path: '/towns/blanchetown' },
  { name: 'Morgan',      lat: -34.0340563, lng: 139.6679620, path: '/towns/morgan' },
  { name: 'Waikerie',    lat: -34.1815175, lng: 139.9855992, path: '/towns/waikerie' },
  { name: 'Barmera',     lat: -34.2532589, lng: 140.4579655, path: '/towns/barmera' },
  { name: 'Glossop',     lat: -34.2700936, lng: 140.5279132, path: '/towns/glossop' },
  { name: 'Monash',      lat: -34.2376497, lng: 140.5575459, path: '/towns/monash' },
  { name: 'Berri',       lat: -34.2854741, lng: 140.6017385, path: '/towns/berri' },
  { name: 'Loxton',      lat: -34.4511348, lng: 140.5696644, path: '/towns/loxton' },
  { name: 'Renmark',     lat: -34.1743516, lng: 140.7468863, path: '/towns/renmark' },
  { name: 'Paringa',     lat: -34.1786264, lng: 140.7861587, path: '/towns/paringa' }
];

function widgetOut_(html, title) {
  return HtmlService.createHtmlOutput(html).setTitle(title + ' — Greeks of the Riverland')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function jsonForHtml_(o) { return JSON.stringify(o).replace(/</g, '\\u003c'); }

/** Families that may be shown publicly: Register rows marked Published + the Map Families tab. */
function publicFamilies_() {
  const out = [];
  try {
    const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(REG.TAB);
    if (sh && sh.getLastRow() >= 3) {
      const H = regHeaders_();
      const ix = function (n) { return H.indexOf(n); };
      sh.getRange(3, 1, sh.getLastRow() - 2, H.length).getValues().forEach(function (r) {
        if (String(r[ix('Website Status')]).trim() !== 'Published' || !String(r[ix('Family Surname')]).trim()) return;
        if (String(r[ix('Permission to Publish')]).trim() === 'No') return;
        out.push({ family: String(r[ix('Family Surname')]).trim(), alt: String(r[ix('Other Surname Spellings')]).trim(),
          towns: String(r[ix('Riverland Towns / Areas')]).trim(), url: String(r[ix('Website Page Link')]).trim() });
      });
    }
  } catch (e) {}
  mapFamilies_().forEach(function (f) {
    const ex = out.filter(function (o) { return o.family.toLowerCase() === f.family.toLowerCase(); })[0];
    if (ex) { if (ex.towns.indexOf(f.town) < 0) ex.towns = ex.towns ? ex.towns + ', ' + f.town : f.town; if (!ex.url) ex.url = f.url; if (!ex.detail) ex.detail = f.detail; }
    else out.push({ family: f.family, alt: '', towns: f.town, url: f.url, detail: f.detail || '' });
  });
  return out;
}

function townsMapPage_() {
  const data = { site: CONFIG.SITE_URL, towns: RIVERLAND_TOWNS, families: publicFamilies_() };
  return widgetOut_(TOWNS_MAP_HTML.replace('__DATA__', function () { return jsonForHtml_(data); }), 'Explore the Riverland');
}

function findPage_() {
  const data = { site: CONFIG.SITE_URL, families: publicFamilies_() };
  return widgetOut_(FIND_HTML.replace('__DATA__', function () { return jsonForHtml_(data); }), 'Find a Family');
}

/** ?page=data — the same public data as JSON, for the widgets hosted outside Apps Script (GitHub Pages).
 *  Those load in every browser, including Brave/Safari, which block the cookies Apps Script embeds need. */
function dataJson_(e) {
  const cache = CacheService.getScriptCache();
  let json = cache.get('publicData');
  if (!json) {
    json = JSON.stringify({ site: CONFIG.SITE_URL, towns: RIVERLAND_TOWNS, families: publicFamilies_() });
    try { cache.put('publicData', json, 60); } catch (err) {}
  }
  const cb = e && e.parameter && e.parameter.callback;
  if (cb && /^[A-Za-z_$][\w$]{0,40}$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/** ?page=town&t=Berri — the families list embedded on each town page. */
function townPage_(name) {
  const t = RIVERLAND_TOWNS.filter(function (x) { return x.name.toLowerCase() === String(name || '').trim().toLowerCase(); })[0];
  const town = t ? t.name : String(name || '').trim().slice(0, 40);
  const norm = function (s) { return String(s || '').toLowerCase().replace(/[^a-z]/g, ''); };
  const fams = publicFamilies_().filter(function (f) {
    return String(f.towns).split(/\s*,\s*/).map(norm).indexOf(norm(town)) >= 0;
  }).sort(function (a, b) { return a.family.localeCompare(b.family); });
  const data = { site: CONFIG.SITE_URL, town: town, families: fams };
  return widgetOut_(TOWN_HTML.replace('__DATA__', function () { return jsonForHtml_(data); }), (town || 'Town') + ' families');
}

/* =================== SAMPLE DATA (demo only) =================== */
/*
 * seedSampleData()   adds demonstration families to the Family Register (marked Published) so the
 *                    map, Find a Family and town pages can be seen working. Safe to run again.
 * removeSampleData() deletes every SAMPLE-xx row. Run this before the site goes public with real data.
 */
const SAMPLE_FAMILIES = [
  ['Andreou', '', 'Berri, Barmera', 'Kythera', 'Greece', '1951', 'Fruit block and packing shed work'],
  ['Christodoulou', '', 'Renmark', 'Kastellorizo', 'Greece', '1949', 'Market garden and later a fruit shop'],
  ['Dimitriou', '', 'Loxton', 'Florina', 'Greece', '1956', 'Irrigation channel work and vineyard'],
  ['Georgiou', '', 'Waikerie', 'Lefkada', 'Greece', '1954', 'Citrus growing'],
  ['Karamanos', '', 'Morgan', 'Ithaca', 'Greece', '1938', 'River trade and general store'],
  ['Konstantinidis', 'Constantinidis', 'Monash, Glossop', 'Kozani', 'Greece', '1960', 'Dried fruit block'],
  ['Lambrou', '', 'Paringa, Renmark', 'Nicosia', 'Cyprus', '1958', 'Winery and cellar work'],
  ['Papadopoulos', '', 'Barmera', 'Kalamata', 'Greece', '1952', 'Cafe on the main street'],
  ['Vlahos', 'Vlachos', 'Blanchetown', 'Chios', 'Greece', '1947', 'Fishing and boat building']
];
const SAMPLE_NOTE = 'SAMPLE DATA - for demonstration only. Delete by running removeSampleData() in Apps Script.';

function seedSampleData() {
  removeSampleData();
  const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(REG.TAB);
  if (!sh) throw new Error('Run setupRegister() first.');
  const H = regHeaders_();
  const rows = SAMPLE_FAMILIES.map(function (f, i) {
    const v = {
      'Submission ID': 'SAMPLE-' + ('0' + (i + 1)).slice(-2), 'Date Submitted': new Date(),
      'Family Surname': f[0], 'Other Surname Spellings': f[1], 'Riverland Towns / Areas': f[2],
      'Place of Origin': f[3], 'Region / Country': f[4], 'Year Arrived in Australia': f[5], 'Work / Occupations': f[6],
      'Family Story': 'Sample entry used to demonstrate the website. Not a real family record.',
      'Permission to Publish': 'Yes', 'Photo Permission': 'No', 'Contributor Name': 'Sample data', 'May Contact?': 'No',
      'Photos / Documents Supplied': 'No', 'Website Status': 'Published', 'Priority': 'Low',
      'Needs Editing': 'No', 'Needs Fact Check': 'No', 'Needs Photo Caption': 'No', 'Ready to Publish': 'Yes',
      'Follow-up Needed': 'No', 'Follow-up Notes': SAMPLE_NOTE
    };
    return H.map(function (h) { return v[h] === undefined ? '' : v[h]; });
  });
  const r = Math.max(sh.getLastRow() + 1, 3);
  sh.getRange(r, 1, rows.length, H.length).setValues(rows);
  return 'Sample families added: ' + rows.length;
}

function removeSampleData() {
  const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(REG.TAB);
  if (!sh || sh.getLastRow() < 3) return 'Sample rows removed: 0';
  const ids = sh.getRange(3, 1, sh.getLastRow() - 2, 1).getValues();
  let n = 0;
  for (let i = ids.length - 1; i >= 0; i--) {
    if (/^SAMPLE-/.test(String(ids[i][0]))) { sh.deleteRow(i + 3); n++; }
  }
  return 'Sample rows removed: ' + n;
}

/** Quick self-check: run from the editor; every line should read OK. */
function selfTest() {
  const out = [];
  const fams = publicFamilies_();
  out.push('OK public families: ' + fams.length);
  RIVERLAND_TOWNS.forEach(function (t) {
    const html = townPage_(t.name).getContent();
    out.push((html.indexOf('__DATA__') < 0 ? 'OK ' : 'FAIL ') + 'town widget ' + t.name);
  });
  out.push((townsMapPage_().getContent().indexOf('__DATA__') < 0 ? 'OK' : 'FAIL') + ' map');
  out.push((findPage_().getContent().indexOf('__DATA__') < 0 ? 'OK' : 'FAIL') + ' find');
  Logger.log(out.join('\n'));
  return out.join('\n');
}

function privacyPage_() {
  return widgetOut_(PRIVACY_HTML, 'Privacy, Permission and Photo Use');
}

/* ------------------------------------------------------------------ */

const TOWNS_MAP_HTML = String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><base target="_blank">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Lora:wght@400;600&display=swap" rel="stylesheet">
<style>
:root{--navy:#1b365d;--navy2:#24497a;--cream:#fbf8f1;--pale:#eaf1f8}
html,body{margin:0;height:100%;background:var(--cream);font-family:Lora,Georgia,serif}
#map{position:absolute;inset:0;border-radius:14px;overflow:hidden;background:#e9eef2}
.leaflet-container{font-family:Lora,Georgia,serif}
.leaflet-tile-pane{filter:sepia(.14) saturate(1.25) contrast(1.06)}
.ln{position:absolute;height:2px;background:var(--navy);transform-origin:0 50%;z-index:690;pointer-events:none;opacity:.75}
.leaflet-container a.lbl{color:var(--navy)}
.leaflet-container a.lbl:hover,.leaflet-container a.lbl:focus{color:#fff}
.lbl{position:absolute;white-space:nowrap;background:#fff;color:var(--navy);font:700 17px/1 'Libre Baskerville',Georgia,serif;
 padding:9px 13px;border-radius:10px;border:2px solid var(--navy);box-shadow:0 3px 10px rgba(16,36,64,.22);text-decoration:none;
 transform:translate(var(--tx),var(--ty));transition:background .15s,color .15s}
.lbl:hover,.lbl:focus{background:var(--navy);color:#fff;outline:none}
.lbl .n{display:block;font:600 12px/1.2 Lora,Georgia,serif;margin-top:4px;color:#5a6b80}
.lbl:hover .n,.lbl:focus .n{color:#dfe8f3}
.hidden{visibility:hidden}
.dot{width:18px;height:18px;border-radius:50%;background:var(--navy);border:4px solid #fff;box-shadow:0 0 0 2px var(--navy),0 2px 6px rgba(0,0,0,.35);box-sizing:border-box;cursor:pointer}
.hint{position:absolute;right:12px;top:12px;z-index:800;background:rgba(255,255,255,.95);color:var(--navy);padding:8px 13px;border-radius:999px;
 font:600 14px Lora,Georgia,serif;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.leaflet-popup-content{font:15px/1.45 Lora,Georgia,serif;color:#24323f;margin:14px 16px}
.pop b{font:700 18px 'Libre Baskerville',Georgia,serif;color:var(--navy)}
.pop a.go{display:inline-block;margin-top:10px;background:var(--navy);color:#fff;text-decoration:none;padding:10px 16px;border-radius:9px;font-weight:600}
.small .lbl{font-size:13px;padding:6px 9px;border-width:1.5px}
.small .lbl .n{display:none}
.small .hint{display:none}
.pick{display:none;position:absolute;right:8px;top:8px;z-index:900;font:600 15px Lora,Georgia,serif;color:#fff;background:var(--navy);border:0;border-radius:10px;padding:9px 10px;max-width:60%}
.small .pick{display:block}
.small .dot{width:15px;height:15px;border-width:3px}
.leaflet-control-zoom a{width:38px!important;height:38px!important;line-height:38px!important;font-size:22px!important}
</style></head>
<body>
<div id="map" role="application" aria-label="Map of Riverland towns. Choose a town to open its page."></div>
<div class="hint">Click a town to explore</div>
<select class="pick" id="pick" aria-label="Choose a town"><option value="">Choose a town &#9662;</option></select>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script>
var DATA = __DATA__;
var small = innerWidth < 560; if (small) document.body.classList.add('small');
function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z]/g,'')}
function link(p){p=String(p||'');return /^https?:/.test(p)?p:DATA.site+p}
function famsOf(t){return DATA.families.filter(function(f){return String(f.towns).split(/\s*,\s*/).map(norm).indexOf(norm(t))>=0}).map(function(f){return f.family}).sort()}

var map = L.map('map', {zoomControl:false, scrollWheelZoom:false, dragging:!L.Browser.mobile, tap:true, zoomSnap:0.25, attributionControl:true});
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  maxZoom:15, minZoom:7,
  attribution: small ? '&copy; Esri, OSM' : 'Map: Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
L.control.zoom({position: small ? 'bottomright' : 'bottomleft'}).addTo(map);
map.attributionControl.setPrefix(false);
DATA.towns.slice().sort(function(a,b){return a.name.localeCompare(b.name)}).forEach(function(t){var o=document.createElement('option');o.value=link(t.path);o.textContent=t.name;document.getElementById('pick').appendChild(o)});
document.getElementById('pick').onchange=function(){if(this.value)window.open(this.value,'_blank');this.value=''};
var bounds = L.latLngBounds(DATA.towns.map(function(t){return [t.lat,t.lng]}));
map.fitBounds(bounds, {padding: small ? [18,18] : [60,80]});
map.setMaxBounds(bounds.pad(1.2));

var pane = map.getPanes().markerPane, items = [];
DATA.towns.forEach(function (t, i) {
  var fam = famsOf(t.name);
  var m = L.marker([t.lat,t.lng], {icon:L.divIcon({className:'',html:'<div class="dot" title="'+esc(t.name)+'"></div>',iconSize:[18,18],iconAnchor:[9,9]}), keyboard:false}).addTo(map);
  m.bindPopup('<div class="pop"><b>'+esc(t.name)+'</b>'+(fam.length?'<div>Families: '+esc(fam.join(', '))+'</div>':'')+
    '<a class="go" href="'+esc(link(t.path))+'" target="_blank" rel="noopener">Open '+esc(t.name)+' page &rarr;</a></div>');
  var a = document.createElement('a');
  a.className = 'lbl'; a.href = link(t.path); a.target = '_blank'; a.rel = 'noopener';
  a.innerHTML = esc(t.name) + (fam.length ? '<span class="n">' + fam.length + ' famil' + (fam.length===1?'y':'ies') + '</span>' : '');
  a.setAttribute('aria-label', 'Open the ' + t.name + ' page');
  map.getContainer().appendChild(a); a.style.zIndex = 700;
  items.push({t:t, el:a});
});

/* Place every label next to its town without overlaps: try close positions first, then further out with a leader line. */
var lines = items.map(function(){var d=document.createElement('div');d.className='ln';map.getContainer().appendChild(d);return d});
function rectOf(el){var b=el.getBoundingClientRect(),c=map.getContainer().getBoundingClientRect();return {l:b.left-c.left,t:b.top-c.top,r:b.right-c.left,b:b.bottom-c.top}}
function place() {
  var cont = map.getContainer().getBoundingClientRect(), placed = [];
  ['.leaflet-control-zoom','.hint','.pick','.leaflet-control-attribution'].forEach(function(q){var e=document.querySelector(q);if(e&&e.offsetParent!==null&&getComputedStyle(e).display!=='none')placed.push(rectOf(e))});
  var dots = items.map(function(o){return map.latLngToContainerPoint([o.t.lat,o.t.lng])});
  var order = items.map(function(it,i){return i}).sort(function(a,b){
    var ca=dots.filter(function(d){return Math.abs(d.x-dots[a].x)<90&&Math.abs(d.y-dots[a].y)<70}).length;
    var cb=dots.filter(function(d){return Math.abs(d.x-dots[b].x)<90&&Math.abs(d.y-dots[b].y)<70}).length; return cb-ca});
  order.forEach(function (i) {
    var it = items[i], p = dots[i], ln = lines[i];
    it.el.classList.remove('hidden'); it.el.style.left = p.x + 'px'; it.el.style.top = p.y + 'px';
    var w = it.el.offsetWidth, h = it.el.offsetHeight, ok = false, g0 = small ? 9 : 13;
    var rings = small ? [g0, 22] : [g0, 30, 52, 76, 100];
    for (var ri = 0; ri < rings.length && !ok; ri++) {
      var g = rings[ri];
      var opts = [[g,-h/2],[-w-g,-h/2],[-w/2,-h-g],[-w/2,g],[g*.75,-h-g*.75],[g*.75,g*.75],[-w-g*.75,-h-g*.75],[-w-g*.75,g*.75]];
      for (var k = 0; k < opts.length && !ok; k++) {
        var r = {l:p.x+opts[k][0], t:p.y+opts[k][1]}; r.r = r.l + w; r.b = r.t + h;
        if (r.l < 4 || r.t < 4 || r.r > cont.width-4 || r.b > cont.height-4) continue;
        var hit = placed.some(function(q){return !(r.r<q.l-5||r.l>q.r+5||r.b<q.t-5||r.t>q.b+5)}) ||
          dots.some(function(d){return d.x>r.l-10&&d.x<r.r+10&&d.y>r.t-10&&d.y<r.b+10});
        if (hit) continue;
        ok = true; placed.push(r);
        it.el.style.setProperty('--tx', opts[k][0]+'px'); it.el.style.setProperty('--ty', opts[k][1]+'px');
        if (ri > 0) { // leader line from the dot to the nearest edge of the label
          var cx = Math.max(r.l, Math.min(p.x, r.r)), cy = Math.max(r.t, Math.min(p.y, r.b));
          var dx = cx - p.x, dy = cy - p.y, len = Math.sqrt(dx*dx+dy*dy);
          ln.style.display = 'block'; ln.style.left = p.x + 'px'; ln.style.top = (p.y-1) + 'px'; ln.style.width = len + 'px';
          ln.style.transform = 'rotate(' + Math.atan2(dy, dx) + 'rad)';
        } else ln.style.display = 'none';
      }
    }
    if (!ok) { it.el.classList.add('hidden'); ln.style.display = 'none'; }
  });
}
map.on('zoom move resize', place); setTimeout(place, 50); addEventListener('load', place);
</script></body></html>`;

/* ------------------------------------------------------------------ */

const FIND_HTML = String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><base target="_blank">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Lora:wght@400;600&display=swap" rel="stylesheet">
<style>
:root{--navy:#1b365d;--pale:#eef4fa;--line:#c9d7e8;--ink:#24323f}
*{box-sizing:border-box}
html,body{margin:0;background:transparent;font-family:Lora,Georgia,serif;color:var(--ink)}
.box{background:var(--pale);border:1px solid var(--line);border-radius:16px;padding:16px;min-height:100vh}
.ttl{margin:2px 2px 2px;font:700 27px/1.2 'Libre Baskerville',Georgia,serif;color:var(--navy)}
.sub{margin:0 2px 14px;font-size:17px;color:#41526a}
.search{position:relative}
.search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%)}
input{width:100%;font:italic 18px Lora,Georgia,serif;padding:15px 14px 15px 46px;border:2px solid #9fb5cf;border-radius:12px;background:#fff;color:var(--ink)}
input:focus{outline:none;border-color:var(--navy);box-shadow:0 0 0 3px rgba(27,54,93,.15)}
.az{display:grid;grid-template-columns:repeat(7,1fr);gap:7px;margin-top:14px}
.az button{font:700 18px 'Libre Baskerville',Georgia,serif;color:var(--navy);background:#fff;border:1.5px solid #9fb5cf;border-radius:9px;height:46px;cursor:pointer}
.az button:hover,.az button:focus{background:var(--navy);color:#fff;border-color:var(--navy);outline:none}
.note{font-size:14px;color:#56667a;margin:12px 2px 0;line-height:1.4}
.res{display:none;margin-top:12px}
.bar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.bar h3{margin:0;font:700 17px 'Libre Baskerville',Georgia,serif;color:var(--navy)}
.back{font:600 15px Lora,Georgia,serif;background:#fff;color:var(--navy);border:1.5px solid var(--navy);border-radius:9px;padding:9px 12px;cursor:pointer}
.list{max-height:calc(100vh - 250px);overflow:auto;padding-right:4px}
.item{display:block;background:#fff;border:1px solid var(--line);border-radius:11px;padding:12px 14px;margin-bottom:8px;text-decoration:none;color:var(--ink)}
a.item:hover{border-color:var(--navy);box-shadow:0 2px 8px rgba(27,54,93,.15)}
.item b{font:700 18px 'Libre Baskerville',Georgia,serif;color:var(--navy)}
.item small{display:block;font-size:14px;color:#5a6b80;margin-top:3px}
.empty{background:#fff;border:1px dashed #9fb5cf;border-radius:11px;padding:14px;font-size:15px;line-height:1.5}
.empty a{color:var(--navy);font-weight:600}
</style></head>
<body><div class="box">
<h2 class="ttl">Find a Family</h2><p class="sub">Search by surname or browse A&ndash;Z.</p>
<div class="search">
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1b365d" stroke-width="2.5" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
 <input id="q" type="search" placeholder="Search surname..." aria-label="Search surname" autocomplete="off">
</div>
<div id="az" class="az" role="group" aria-label="Browse surnames A to Z"></div>
<div id="res" class="res"><div class="bar"><h3 id="ttl"></h3><button class="back" id="back" type="button">&larr; A&ndash;Z</button></div><div class="list" id="list"></div></div>
<p class="note" id="note">Family names are added as records are submitted and verified.</p>
</div>
<script>
var DATA = __DATA__;
var $ = function(id){return document.getElementById(id)};
function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fold(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
function link(u){u=String(u||'').trim();if(!u)return '';return /^https?:/.test(u)?u:DATA.site+u.replace(/^\/?/,'/')}
var fams = DATA.families.slice().sort(function(a,b){return a.family.localeCompare(b.family)});
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function(L){var b=document.createElement('button');b.type='button';b.textContent=L;b.setAttribute('aria-label','Surnames starting with '+L);b.onclick=function(){show(L,fams.filter(function(f){return fold(f.family).charAt(0)===L.toLowerCase()}),'Surnames starting with '+L)};$('az').appendChild(b)});
function show(key, list, title){
  $('az').style.display='none'; $('note').style.display='none'; $('res').style.display='block'; $('ttl').textContent=title;
  $('list').innerHTML = list.length ? list.map(function(f){var u=link(f.url);var inner='<b>'+esc(f.family)+'</b>'+((f.towns||f.alt)?'<small>'+esc([f.towns,f.alt&&('Also spelt: '+f.alt)].filter(String).join(' · '))+'</small>':'')+(u?'':'<small>Family page coming soon</small>');
    return u?'<a class="item" href="'+esc(u)+'" target="_blank" rel="noopener">'+inner+'</a>':'<div class="item">'+inner+'</div>'}).join('')
   : '<div class="empty">No family names '+(key.length===1?'under <b>'+esc(key)+'</b>':'match <b>'+esc(key)+'</b>')+' yet. Family names are added as records are submitted and verified.<br><a href="'+esc(DATA.site)+'/add-your-family" target="_blank" rel="noopener">Add your family to the history &rarr;</a></div>';
}
function reset(){ $('q').value=''; $('az').style.display=''; $('note').style.display=''; $('res').style.display='none'; }
$('back').onclick=reset;
$('q').addEventListener('input',function(){var v=fold(this.value.trim()); if(!v){reset();return;}
  show(this.value.trim(), fams.filter(function(f){return fold(f.family).indexOf(v)>=0||fold(f.alt).indexOf(v)>=0}), 'Results for “'+this.value.trim()+'”');});
</script></body></html>`;

/* ------------------------------------------------------------------ */

const TOWN_HTML = String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><base target="_blank">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:transparent;font:16px/1.38 Lora,Georgia,serif;color:#000}
h2{margin:0;font:700 22.67px/1.38 'Libre Baskerville',Georgia,serif;color:#1f3a5f}
h3{margin:0;font:700 17.33px/1.38 'Libre Baskerville',Georgia,serif;color:#1f3a5f}
p{margin:8px 0 0}
ul{list-style:none;margin:8px 0 0;padding:0}
li{margin:0 0 4px}
a{color:#1f3a5f;font-weight:700;text-decoration:underline;text-underline-offset:2px}
a:hover,a:focus{color:#b8914a}
b{font-weight:700}
.muted{color:#5f5b53}
.cta{margin-top:18px}
.cta a{font-weight:400}
</style></head>
<body><div id="out" style="padding-left:6px"></div>
<script>
var DATA = __DATA__;
function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z]/g,'')}
function link(u){u=String(u||'').trim();if(!u)return '';return /^https?:/.test(u)?u:DATA.site+u.replace(/^\/?/,'/')}
var T = esc(DATA.town), f = DATA.families || [];
var h = '<h3>Families</h3>';
if (f.length) {
  h += '<ul>' + f.map(function (x) {
    var u = link(x.url), name = esc(x.family) + ' Family';
    var also = String(x.towns||'').split(/\s*,\s*/).filter(function(t){return t && norm(t)!==norm(DATA.town)});
    var extra = [x.detail ? esc(x.detail) : '', also.length ? 'also ' + esc(also.join(', ')) : ''].filter(String).join(' · ');
    return '<li>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + name + '</a>' : '<b>' + name + '</b>') +
      (extra ? ' <span class="muted">— ' + extra + '</span>' : '') + '</li>';
  }).join('') + '</ul>';
} else {
  h += '<p><em>No families listed yet.</em></p>';
}
h += '<p class="cta"><b>Did your family live in ' + T + '?</b> Please share what you know on the <a href="' + esc(DATA.site) + '/add-your-family" target="_blank" rel="noopener">Add Your Family</a> page.</p>';
document.getElementById('out').innerHTML = h;
</script></body></html>`;

const PRIVACY_HTML = String.raw`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><base target="_top">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
<style>
:root{--navy:#1b365d;--olive:#5E6B3A;--gold:#B8914A;--cream:#F6F1E6;--line:#e4d9c3;--ink:#2f2a24}
*{box-sizing:border-box}
html,body{margin:0;background:#fbf8f1;font-family:Lora,Georgia,serif;color:var(--ink);line-height:1.7}
.top{background:linear-gradient(135deg,#1f3a5f,#26466b 60%,#3d4f3a);color:#fff;padding:34px 18px 30px;text-align:center;position:relative}
.top:after{content:"";position:absolute;left:0;right:0;bottom:0;height:12px;opacity:.4;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='14'%3E%3Cpath d='M0 13h6V5h8v4h-4V7H8v6h12V1H2' fill='none' stroke='%23E2C48E' stroke-width='1.6'/%3E%3C/svg%3E") repeat-x}
.eyebrow{letter-spacing:4px;font-size:12px;color:#E2C48E;font-weight:600;text-transform:uppercase}
h1{font-family:'Libre Baskerville',serif;font-weight:400;font-size:clamp(24px,5vw,36px);margin:8px 0 0}
.wrap{max-width:760px;margin:0 auto;padding:28px 18px 60px}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:28px 26px;box-shadow:0 2px 10px rgba(31,58,95,.06)}
h2{font-family:'Libre Baskerville',serif;color:var(--navy);font-weight:700;font-size:22px;margin:0 0 18px;line-height:1.3}
p{margin:0 0 14px;font-size:16px}
p:last-child{margin-bottom:0}
.aim{background:var(--cream);border-left:4px solid var(--olive);padding:16px 18px;border-radius:10px;margin-top:18px;font-style:italic;font-size:15px}
.aim p{margin:0}
.back{display:inline-block;margin-top:22px;font:600 15px Lora,Georgia,serif;color:var(--navy);text-decoration:none}
.back:hover{text-decoration:underline}
</style></head>
<body>
<div class="top">
  <div class="eyebrow"><i class="fa-solid fa-shield-halved"></i> &nbsp;Privacy</div>
  <h1>Privacy, Permission &amp; Photo Use</h1>
</div>
<div class="wrap">
  <div class="card">
    <h2>Our commitment to you</h2>
    <p>We want Greeks of the Riverland to be a respectful and trusted community history project.</p>
    <p>Information and photographs submitted to us will not automatically be published. We will review material before it appears on the website and will only publish information that is appropriate for a public historical record.</p>
    <p>Please only submit photographs, stories or personal information that you have the right to share. If a photograph includes living people, we ask that you consider whether they would be comfortable having the image published online.</p>
    <p>We will avoid publishing sensitive personal information about living people, such as current addresses, phone numbers, email addresses, dates of birth, financial information or other private details.</p>

    <h2 style="margin-top:24px">How we store your information</h2>
    <p>Information submitted through our online forms will be stored in password-protected Google systems, with access limited to authorised project administrators. Private records will not be made publicly accessible through the website.</p>
    <p>While no online system can guarantee absolute security, we will take reasonable steps to protect information and limit access to it.</p>

    <h2 style="margin-top:24px">Corrections and removal</h2>
    <p>If you believe information or a photograph relating to you or your family should be corrected, updated or removed, please contact us and we will review the request.</p>

    <div class="aim">
      <p>Our aim is simple: to preserve the history, stories and photographs of the Greek families of the Riverland while respecting the privacy and wishes of the people whose history we are recording.</p>
    </div>
  </div>
  <a class="back" href="https://sites.google.com/view/greeksoftheriverland">&larr; Back to Greeks of the Riverland</a>
</div>
</body></html>`;
