import { coachStream, getSession, getMessages, TimeoutError, InvalidArgumentError } from "/scholarly_api_latest.js"
var atBottom = true;
var ready = false;
var index = 0;
var imageIndex = 0;
var running = false;
var readyToStop = false;
var controller = null;
var settings = false;
var saveChats = undefined;
var profile = undefined;
var newProfile = undefined;

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function copySession() {
  navigator.clipboard.writeText(session).then(
    () => {
      alert("Copied Session ID: "+session)
    },
    () => {
      alert("Failed to copy session. Error: No permission")
    },
  );
}

function updateSettings() {
  saveChats = document.querySelector('#save-check').checked;
  if(!saveChats) document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  document.cookie = "save-chats="+saveChats+";";

  var select = document.querySelector('select');
  newProfile = select.options[select.selectedIndex].value;
  let profileText = profile.charAt(0).toUpperCase() + profile.slice(1);
  let selectedProfileText = newProfile.charAt(0).toUpperCase() + newProfile.slice(1); 
  if (profile == newProfile) document.querySelector('#profile-tip-text').textContent = "Currently selected profile: "+profileText;
  else document.querySelector('#profile-tip-text').textContent = "Reset chat to switch from "+profileText+" to "+selectedProfileText;
}

function updateImage() {
  if (document.getElementById("upload").files.length == 0) { document.getElementById("image-icon").innerHTML = '<i class="fa-solid fa-image"></i>' }
  else { document.getElementById("image-icon").innerHTML = '<i class="fa-solid fa-trash-can"></i>' }
}

setInterval(updateSettings, 100);
setInterval(updateImage, 100);

function settingsButton() {
  if (ready === false) return;
  if(!settings) {
    document.querySelector('.settings-container').style.display = "flex";
    document.querySelector('#settings').querySelector('i').classList.remove('fa-wrench');
    document.querySelector('#settings').querySelector('i').classList.add('fa-times');
  }
  else {
    document.querySelector('.settings-container').style.display = "none";
        document.querySelector('#settings').querySelector('i').classList.remove('fa-times');
    document.querySelector('#settings').querySelector('i').classList.add('fa-wrench');
  }
  settings = !settings;
}

function resetButton() {
  if (ready === false) return;
  else clearSessionCookie();
}

function uploadImage() {
  if (profile !== "vision") { 
    alert("This profile cannot upload images. Change your profile in settings.");
    event.preventDefault();
  }
  else {
    if (document.getElementById("upload").files.length != 0) {
      if(confirm('Would you like to remove the uploaded image?')) {
        document.getElementById("upload").value = '';
      }
      event.preventDefault();
    }
  }
}

function clearSessionCookie() {
  if (confirm("Do you want to reset this chat?") == true) {
    if (newProfile == profile) document.cookie = "profile=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    else document.cookie = "profile="+newProfile+";";
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    location.reload();
  }
}

async function getSessionCookie() {
  let select = document.querySelector('select');
  profile = getCookie('profile');
  if (profile === undefined) profile = 'default';
  select.value = profile;
  saveChats = getCookie("save-chats");
  if(saveChats === "false") {
    document.querySelector('#save-check').checked = false;
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    let session = await getSession(profile, 5000);
    return session
  }
  if(saveChats === undefined) {
    document.cookie = "save-chats=true;";
    saveChats = true;
    document.querySelector('#save-check').checked = true;
  }
  if (getCookie("session") == undefined) {
    try {
      let session = await getSession(profile, 5000);
      document.cookie = "session="+session+";";
      return getCookie('session');
    } catch (error) {
      if (error instanceof TimeoutError) {
        return undefined;
      }
    }
  }
  else {
    var cookieSession = getCookie("session");
    try {
      const messages = await getMessages(cookieSession, 5000);
      messages.forEach(function(item) {
        let image = item.content.length === 2;
        if (item.role == "user") {
          const meItem = document.createElement("li");
          if (image) {
              imageIndex += 1;
              meItem.innerHTML = `
              <div class="coach-feature-card1">
                <svg viewBox="0 0 731.4285714285713 1024" class="coach-icon02">
                  <path
                  d="M731.429 799.429c0 83.429-54.857 151.429-121.714 151.429h-488c-66.857 0-121.714-68-121.714-151.429 0-150.286 37.143-324 186.857-324 46.286 45.143 109.143 73.143 178.857 73.143s132.571-28 178.857-73.143c149.714 0 186.857 173.714 186.857 324zM585.143 292.571c0 121.143-98.286 219.429-219.429 219.429s-219.429-98.286-219.429-219.429 98.286-219.429 219.429-219.429 219.429 98.286 219.429 219.429z"
                  ></path>
                </svg>
                <div class="coach-container2">
                  <h2 class="coach-text14">
                    <span>Me</span>
                    <br />
                  </h2>
                  <button id='image${imageIndex.toString()}' data-file="${imageIndex.toString()}" class="button-secondary button button-md input-field-register" style="padding: 12px; margin-bottom: 12px; margin-top: -10px;">
                    <span><i class="fa-solid fa-image"></i> Image Attached</span>
                  </button>
                  <span style="white-space: pre-wrap;"><pre>${item.content[1].text}</pre></span>
                </div>
              </div>
              `;
              document.getElementById("the_list").appendChild(meItem);
              let id = '#image'+imageIndex.toString();
              document.querySelector(id).addEventListener('click', openImage);
          }
          else {
            meItem.innerHTML = `
            <div class="coach-feature-card1">
              <svg viewBox="0 0 731.4285714285713 1024" class="coach-icon02">
                <path
                d="M731.429 799.429c0 83.429-54.857 151.429-121.714 151.429h-488c-66.857 0-121.714-68-121.714-151.429 0-150.286 37.143-324 186.857-324 46.286 45.143 109.143 73.143 178.857 73.143s132.571-28 178.857-73.143c149.714 0 186.857 173.714 186.857 324zM585.143 292.571c0 121.143-98.286 219.429-219.429 219.429s-219.429-98.286-219.429-219.429 98.286-219.429 219.429-219.429 219.429 98.286 219.429 219.429z"
                ></path>
              </svg>
              <div class="coach-container2">
                <h2 class="coach-text14">
                  <span>Me</span>
                  <br />
                </h2>
                <span style="white-space: pre-wrap;"><pre>${item.content[0].text}</pre></span>
              </div>
            </div>
            `;
            document.getElementById("the_list").appendChild(meItem);
          }
        }
        else if (item.role == "assistant") {
          index += 1;
          const messageItem = document.createElement("li");
          messageItem.innerHTML = `
        <div class="coach-feature-card">
          <svg viewBox="0 0 1316.5714285714284 1024" class="coach-icon">
            <path d="M1013.714 477.714l10.286 180.571c4.571 80.571-164 146.286-365.714 146.286s-370.286-65.714-365.714-146.286l10.286-180.571 328 103.429c9.143 2.857 18.286 4 27.429 4s18.286-1.143 27.429-4zM1316.571 292.571c0 8-5.143 14.857-12.571 17.714l-640 201.143c-2.286 0.571-4 0.571-5.714 0.571s-3.429 0-5.714-0.571l-372.571-117.714c-32.571 25.714-55.429 88.571-60 165.714 21.714 12.571 36 35.429 36 62.286 0 25.714-13.143 48-33.143 61.143l33.143 247.429c0.571 5.143-1.143 10.286-4.571 14.286s-8.571 6.286-13.714 6.286h-109.714c-5.143 0-10.286-2.286-13.714-6.286s-5.143-9.143-4.571-14.286l33.143-247.429c-20-13.143-33.143-35.429-33.143-61.143 0-27.429 15.429-50.857 37.143-63.429 3.429-66.857 20.571-138.857 56-188.571l-190.286-59.429c-7.429-2.857-12.571-9.714-12.571-17.714s5.143-14.857 12.571-17.714l640-201.143c2.286-0.571 4-0.571 5.714-0.571s3.429 0 5.714 0.571l640 201.143c7.429 2.857 12.571 9.714 12.571 17.714z"></path>
          </svg>
          <div class="coach-container1">
            <h2 class="coach-text10">
              <span>Coach</span>
              <br />
            </h2>
            <span style="white-space: pre-wrap;"><pre id=textbox>${item.content}</pre></span>
          </div>
        </div>
        `;
          document.getElementById("the_list").appendChild(messageItem);
        }
      });
      window.scrollTo(0, document.body.scrollHeight);
      return cookieSession;
    } catch (error) {
      if (error instanceof TimeoutError) {
        return undefined;
      }
      else if (error instanceof InvalidArgumentError) {
        return "outdated";
      }
    }
  }
}

var session = await getSessionCookie();
if (session != "outdated" && session != undefined) {
  document.querySelector('#session-text').textContent = "ID: "+session;
  ready = true;
  document.querySelector('#button-text').innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
}
else if (session === "outdated") {
  document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  document.cookie = "profile=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  location.reload();
}
else if (session == undefined) {
  let elemDiv = document.createElement('div');
  elemDiv.innerHTML = `
              <div class="adblock-container">
                <div class="adblock-heading-container">
                  <svg viewBox="0 0 1024 1024" class="adblock-icon">
                    <path
                      d="M554 554v-256h-84v256h84zM554 726v-86h-84v86h84zM512 86q176 0 301 125t125 301-125 301-301 125-301-125-125-301 125-301 301-125z"
                    ></path>
                  </svg>
                  <h1 class="adblock-text">
                    <span><span>Failed to Connect</span></span>
                    <br />
                  </h1>
                  <span class="adblock-text03">
                    <span>
                      <span style="white-space: pre-wrap;">Coach is in early access, and we cannot connect to our servers. Apologies for the inconvienience as we try to bring Coach back online.
                      </span>
                    </span>
                    <br />
                    <span></span>
                    <br />
                    <span></span>
                    <br />
                  </span>
                </div>
              </div>
              `;
  let loc = document.getElementById('adblock_location');
  loc.appendChild(elemDiv);
}

window.addEventListener('scroll', function() {
  if (document.documentElement.scrollTop + window.innerHeight > document.documentElement.scrollHeight - 60) {
    atBottom = true;
  }
  else {
    atBottom = false;
  }
});


document.querySelector('#button').addEventListener('click', handleButtonClick);
document.querySelector('#settings').addEventListener('click', settingsButton);
document.querySelector('#reset').addEventListener('click', resetButton);
document.querySelector('#copy').addEventListener('click', copySession);
document.querySelector('#upload').addEventListener('click', uploadImage);
document.addEventListener("keydown", function(event) {
  if (event.code === "Enter" && !event.shiftKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    handleEnter();
  }
});

function openImage() {
  if (this.innerText != ' Image Attached') return;
  window.open("https://legacy.scholarly.digital/v1/image/"+session+"/"+this.dataset.file);
}

function delay(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

function handleButtonClick() {
  if (running && readyToStop && ready) {
    controller.abort();
  }
  else if (!running && !readyToStop && ready) {
    Send();
  }
}
function handleEnter() {
  if (!running && !readyToStop) {
    Send();
  }
}

async function Send() {
  var sessionToken = session;
  var sQuestion = promptinput.value;
  var image = null
  if (sQuestion == "") {
    return;
  }
  if(settings) settingsButton();
  if(profile === 'vision') { if (document.getElementById("upload").files.length === 1) {
    image = document.getElementById("upload").files[0];
    imageIndex += 1;
  } }
  document.querySelector('#button-text').innerHTML = "<i class='fa-solid fa-gear fa-spin'></i>";
  running = true;
  index += 1;
  const meItem = document.createElement("li");
  if (!image) {
  meItem.innerHTML = `
  <div class="coach-feature-card1">
    <svg viewBox="0 0 731.4285714285713 1024" class="coach-icon02">
      <path
      d="M731.429 799.429c0 83.429-54.857 151.429-121.714 151.429h-488c-66.857 0-121.714-68-121.714-151.429 0-150.286 37.143-324 186.857-324 46.286 45.143 109.143 73.143 178.857 73.143s132.571-28 178.857-73.143c149.714 0 186.857 173.714 186.857 324zM585.143 292.571c0 121.143-98.286 219.429-219.429 219.429s-219.429-98.286-219.429-219.429 98.286-219.429 219.429-219.429 219.429 98.286 219.429 219.429z"
      ></path>
    </svg>
    <div class="coach-container2">
      <h2 class="coach-text14">
        <span>Me</span>
        <br />
      </h2>
      <span style="white-space: pre-wrap;"><pre>${sQuestion}</pre></span>
    </div>
  </div>
  `;
    document.getElementById("the_list").appendChild(meItem);
  }
  else {
    meItem.innerHTML = `
    <div class="coach-feature-card1">
      <svg viewBox="0 0 731.4285714285713 1024" class="coach-icon02">
        <path
        d="M731.429 799.429c0 83.429-54.857 151.429-121.714 151.429h-488c-66.857 0-121.714-68-121.714-151.429 0-150.286 37.143-324 186.857-324 46.286 45.143 109.143 73.143 178.857 73.143s132.571-28 178.857-73.143c149.714 0 186.857 173.714 186.857 324zM585.143 292.571c0 121.143-98.286 219.429-219.429 219.429s-219.429-98.286-219.429-219.429 98.286-219.429 219.429-219.429 219.429 98.286 219.429 219.429z"
        ></path>
      </svg>
      <div class="coach-container2">
        <h2 class="coach-text14">
          <span>Me</span>
          <br />
        </h2>
        <button id='image${imageIndex.toString()}' data-file="${imageIndex.toString()}" class="button-secondary button button-md input-field-register" style="padding: 12px; margin-bottom: 12px; margin-top: -10px;">
          <span><i class="fa-solid fa-gear fa-spin"></i> Uploading Image</span>
        </button>
        <span style="white-space: pre-wrap;"><pre>${sQuestion}</pre></span>
      </div>
    </div>
    `;
    document.getElementById("the_list").appendChild(meItem);
    let id = '#image'+imageIndex.toString();
    document.querySelector(id).addEventListener('click', openImage);
  }
  window.scrollTo(0, document.body.scrollHeight);
  promptinput.value = "";
  await delay(1000);
  const messageItem = document.createElement("li");
  messageItem.innerHTML = `
  <div class="coach-feature-card">
    <svg viewBox="0 0 1316.5714285714284 1024" class="coach-icon">
      <path d="M1013.714 477.714l10.286 180.571c4.571 80.571-164 146.286-365.714 146.286s-370.286-65.714-365.714-146.286l10.286-180.571 328 103.429c9.143 2.857 18.286 4 27.429 4s18.286-1.143 27.429-4zM1316.571 292.571c0 8-5.143 14.857-12.571 17.714l-640 201.143c-2.286 0.571-4 0.571-5.714 0.571s-3.429 0-5.714-0.571l-372.571-117.714c-32.571 25.714-55.429 88.571-60 165.714 21.714 12.571 36 35.429 36 62.286 0 25.714-13.143 48-33.143 61.143l33.143 247.429c0.571 5.143-1.143 10.286-4.571 14.286s-8.571 6.286-13.714 6.286h-109.714c-5.143 0-10.286-2.286-13.714-6.286s-5.143-9.143-4.571-14.286l33.143-247.429c-20-13.143-33.143-35.429-33.143-61.143 0-27.429 15.429-50.857 37.143-63.429 3.429-66.857 20.571-138.857 56-188.571l-190.286-59.429c-7.429-2.857-12.571-9.714-12.571-17.714s5.143-14.857 12.571-17.714l640-201.143c2.286-0.571 4-0.571 5.714-0.571s3.429 0 5.714 0.571l640 201.143c7.429 2.857 12.571 9.714 12.571 17.714z"></path>
    </svg>
    <div class="coach-container1">
      <h2 class="coach-text10">
        <span>Coach</span>
        <br />
      </h2>
      <span style="white-space: pre-wrap;"><pre id=textbox${index}>Thinking...</pre></span>
    </div>
  </div>
  `;
  document.getElementById("the_list").appendChild(messageItem);
  window.scrollTo(0, document.body.scrollHeight);
  var currentContent = "";

  controller = new AbortController();

  const onContentReceived = (content) => {
    if (document.getElementById(("textbox" + index.toString())).innerHTML == "Thinking...") {
      if (image !== null) {
        let id = '#image'+imageIndex.toString();
        document.getElementById("upload").value = '';
        document.querySelector(id).innerHTML = '<span><i class="fa-solid fa-image"></i> Image Attached</span>';
      }
      window.scrollTo(0, document.body.scrollHeight);
      document.getElementById(("textbox" + index.toString())).innerHTML = "";
      document.querySelector('#button-text').innerHTML = '<i class="fa-solid fa-circle-stop"></i>';
      readyToStop = true;
    }
    currentContent += content
    if (atBottom) { window.scrollTo(0, document.body.scrollHeight); }
    document.getElementById(("textbox" + index.toString())).innerHTML = currentContent;
  };

  const onError = (err) => {
    if (document.getElementById(("textbox" + index.toString())).innerHTML == "Thinking...") {
      if (image !== null) {
        let id = '#image'+imageIndex.toString();
        document.querySelector(id).innerHTML = '<span><<i class="fa-solid fa-circle-exclamation"></i> Image Failed</span>';
        document.getElementById("upload").value = '';
      }
    }
    if (atBottom) { window.scrollTo(0, document.body.scrollHeight); }
    if (err.message === "Error: 403") {
      document.getElementById(("textbox" + index.toString())).innerHTML = "Sorry but we faced an error. Someone else is currently using with the same chat session. Maybe start a new one witht the reset button on the bottom left?";
      currentContent = "Sorry but we faced an error. Someone else is currently using with the same chat session. Maybe start a new one with the reset button on the bottom left?";
    }
    else if (err.message === "Error: 400") {
      document.getElementById(("textbox" + index.toString())).innerHTML = "Sorry but we faced an error. The chat session you were using has disappeared on our end. Maybe start a new one with the reset button on the bottom left?";
      currentContent = "Sorry but we faced an error. The chat session you were using has disappeared on our end. Maybe start a new one with the reset button on the bottom left?";
    }
    else {
      document.getElementById(("textbox" + index.toString())).innerHTML = "Sorry but we faced an error. Maybe start a new chat with the reset button on the bottom left. If you want to contact a developer, here is some extra information: " + err;
      currentContent = "Sorry but we faced an error. Maybe start a new chat with the reset button on the bottom left. If you want to contact a developer, here is some extra information: " + err.message;
    }
  }

  const onStreamFinished = (manual) => {
    if (manual === true) {
      currentContent += "[STOPPED BY USER]"
      document.getElementById(("textbox" + index.toString())).innerHTML = currentContent;
    }
    running = false;
    readyToStop = false;
    document.querySelector('#button-text').innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    window.scrollTo(0, document.body.scrollHeight);
  };

  coachStream(sQuestion, sessionToken, image, onContentReceived, onStreamFinished, onError, controller.signal);
}