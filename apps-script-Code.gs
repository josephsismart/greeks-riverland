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
  UPLOAD_URL: 'https://script.google.com/macros/s/AKfycbzhLYzjtKO_nrwsk3J_qXKdL0ngMO3_I6rHPRe4lxHibzdpIAncmMio2-mH4MjWIkdaGg/exec'
};

/* ============================ SETUP ============================ */

function setupAll() {
  const out = [];
  out.push(setupSheetTabs_());
  out.push(setupMap());
  out.push(getUploadRootFolder_().getUrl());
  out.push(removeFileUploadQuestions_());
  out.push(installTriggers_());
  Logger.log(out.join('\n'));
  return out.join('\n');
}

/** Run AFTER the web app is deployed: puts the upload link into the Form's Photographs section. */
function linkUploadPageInForm() {
  const url = CONFIG.UPLOAD_URL || ScriptApp.getService().getUrl();
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
    if (['onFormSubmitNotify', 'monthlyBackup'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onFormSubmitNotify').forForm(CONFIG.FORM_ID).onFormSubmit().create();
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
  if (e && e.parameter && e.parameter.page === 'map') return mapPage_();
  const t = HtmlService.createTemplate(UPLOAD_HTML);
  t.maxPhotos = CONFIG.MAX_PHOTOS;
  t.siteUrl = CONFIG.SITE_URL;
  return t.evaluate()
    .setTitle('Share Family Photos — Greeks of the Riverland')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
  MailApp.sendEmail({
    to: notifyEmails_(),
    subject: 'New family photos — ' + meta.surname + ' (' + photos.length + ' photo' + (photos.length === 1 ? '' : 's') + ')',
    htmlBody: '<p><b>' + esc_(meta.name) + '</b> (' + esc_(meta.relationship) + ') sent ' + photos.length + ' photo(s) of the <b>' +
      esc_(meta.surname) + '</b> family.</p><p><a href="' + folder.getUrl() + '">Open the photos in Drive</a> · ' +
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
        <select id="town"><option value=""></option><option>Berri</option><option>Renmark</option><option>Barmera</option><option>Monash</option><option>Loxton</option><option>Paringa</option><option>Glossop</option><option>Cobdogla</option><option>Waikerie</option><option>Other</option></select></div>
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
  sh.getRange('A2:A1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(MAP_TOWNS, true).setAllowInvalid(false).build());
  sh.getRange('D2:D1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).build());
  return 'Map ready. Image id ' + id + '. Map link: ' + CONFIG.UPLOAD_URL + '?page=map';
}

function mapFamilies_() {
  const sh = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName('Map Families');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
    .filter(function (r) { return r[0] && r[1] && String(r[3]).toLowerCase() !== 'no'; })
    .map(function (r) { return { town: String(r[0]).trim(), family: String(r[1]).trim(), url: String(r[2]).trim() }; });
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
