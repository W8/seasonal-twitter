const userData={uid:localStorage.getItem("uid")||null,accessToken:localStorage.getItem("accessToken")||null,accessTokenSecret:localStorage.getItem("accessTokenSecret")||null,username:localStorage.getItem("username")||null},isPro=localStorage.getItem("pro")||!1;let extraProfiles=localStorage.getItem("extraProfiles")||null;const scheduledProfilesLocal=localStorage.getItem("scheduledProfilesLocal")||null,illustration=document.getElementById("illo"),twitterSignIn=document.getElementById("quickstart-sign-in"),profileBlock=document.getElementById("profile-block"),signInStatus=document.getElementById("quickstart-sign-in-status"),signInID=document.getElementById("quickstart-sign-in-id"),twitterPhoto=document.getElementById("photo"),twitterName=document.getElementById("display-name"),screenName=document.getElementById("screen-name"),accountType=document.getElementById("account-type"),upgradeAmount=document.getElementById("upgrade-amount"),buyExtraButton=document.getElementById("buy-extra-button"),checkoutButton=document.getElementById("checkout-button"),displayError=document.getElementById("error-message"),upgradeBlock=document.getElementsByClassName("upgrade-block")[0],formScheduler=document.getElementById("schedule-form"),scheduleButton=document.getElementById("set-button"),formElements=document.getElementById("form-elements"),month=document.getElementById("month"),day=document.getElementById("day"),time=document.getElementById("time");let userNameInput=document.getElementById("name-input"),userBioInput=document.getElementById("bio-input"),userLocationInput=document.getElementById("location-input"),userURLInput=document.getElementById("website-input");const avatarInput=document.getElementById("avatar"),coverInput=document.getElementById("cover"),avatarPreview=document.getElementById("avatar-preview"),coverPreview=document.getElementById("cover-preview"),scheduledProfiles=document.getElementById("scheduled-profiles"),nonYet=document.getElementById("none-yet"),stripe=Stripe("pk_live_61ikliwEju05QhOzh3Sej8mL");function removeElement(a){const b=document.getElementById(a);return b.parentNode.removeChild(b)}-1<window.location.href.indexOf("firebase")&&window.location.replace("https://seasonal-twitter.web.app");const prefersDark=window.matchMedia("(prefers-color-scheme: dark)"),prefersLight=window.matchMedia("(prefers-color-scheme: light)"),browserDate=new Date,browserMonth=browserDate.getMonth();illustration.src=prefersDark.matches?6===browserMonth?"illo-pride.png":10===browserMonth?"illo-hallo-white.png":"illo-white.png":prefersLight.matches?6===browserMonth?"illo-pride.png":10===browserMonth?"illo-hallo-black.png":"illo-black.png":6===browserMonth?"illo-pride.png":10===browserMonth?"illo-hallo.png":"illo.png",prefersDark.addListener(a=>{a.matches&&(illustration.src="illo-white.png")}),prefersLight.addListener(a=>{a.matches&&(illustration.src="illo-black.png")});function startLoading(){scheduleButton.innerHTML="<div class=\"loader\"></div>",scheduleButton.style.cursor="not-allowed",scheduleButton.disabled=!0,formElements.style.visibility="hidden",formElements.style.position="absolute"}async function stopLoading(){scheduleButton.innerHTML="Schedule Yearly",scheduleButton.style.cursor="pointer",scheduleButton.disabled=!1,formElements.removeAttribute("style")}async function formReset(){formScheduler.reset(),avatarPreview.removeAttribute("src"),coverPreview.removeAttribute("src")}async function uploadToServer(a,b){console.log("Uplading image to server...");try{const c=await b.put(a),d=await c.ref.getDownloadURL();return d}catch{throw new Error("Error uploading image and getting download url...")}}async function handleImageUpload(a,b,c,d){try{const e=await imageCompression(a,{maxSizeMB:c,maxWidthOrHeight:d,useWebWorker:!0}),f=await uploadToServer(e,b);return f}catch(a){throw console.log(a),new Error("Error: "+a)}}async function handleAddProfile(a,b,c,d,e,f,g){const h=a.userMonth,i=a.userDay,j=a.userTime,k={uid:userData.uid,accessToken:userData.accessToken,accessTokenSecret:userData.accessTokenSecret,displayName:b,bio:c,userLocation:d,userWebsite:e,avatarDownloadURL:f,coverDownloadURL:g},l={scheduledMonth:h,scheduledDay:i,scheduledTime:j,scheduledProfile:k};try{(async()=>{try{const a=await fetch("https://seasonal-twitter.herokuapp.com/add-profile",{method:"POST",body:JSON.stringify(l),headers:{"Content-Type":"application/json"}});if("Adding profile failed: no more available"===a)throw new Error("No more available profiles.");const b=await a.json();console.log("Adding schedule profile success: ",b),localStorage.clear(),location.reload(!0)}catch(a){alert(`There was an error adding this scheduled profile: You may have reached your limit.`),console.log("Saving scheduled profile error: "+a)}finally{stopLoading(),formReset()}})()}catch{throw error("Error: unable to add scheduled profile.")}}async function submitScheduler(a){a.preventDefault(),startLoading();let b=month.options[month.selectedIndex].value;"Month"===b&&(b=null);let c=day.options[day.selectedIndex].value;"Day"===c&&(c=null);let d=time.options[time.selectedIndex].text;"Time (UTC)"===d&&(d=null);const e={userMonth:b,userDay:c,userTime:d};if(null===b||null===c||null===d)return stopLoading(),void alert("Date and time is required to schedule a profile.");let f=userNameInput.value,g=userBioInput.value,h=userLocationInput.value,i=userURLInput.value;if(""===f)f=null;else if(f.toLowerCase().includes("twitter"))return stopLoading(),void alert("Display name can't include the word \"Twitter\"");""===g&&(g=null),""===h&&(h=null),""===i&&(i=null);const j=firebase.storage().ref(`${b}-${c}-${d}/avatars/${userData.uid}`),k=firebase.storage().ref(`${b}-${c}-${d}/covers/${userData.uid}`),l=avatarInput.files[0],m=coverInput.files[0];if(!f&&!g&&!h&&!i&&!l&&!m)return stopLoading(),void alert("At least one of the following is required to schedule a profile: name, bio, location, url, avatar, cover photo");if(l&&m){const a=await handleImageUpload(l,j,.7,400),b=await handleImageUpload(m,k,2,1500);await handleAddProfile(e,f,g,h,i,a,b)}else if(l){const a=await handleImageUpload(l,j,.7,400);await handleAddProfile(e,f,g,h,i,a,null)}else if(m){const a=await handleImageUpload(m,k,2,1500);await handleAddProfile(e,f,g,h,i,null,a)}else await handleAddProfile(e,f,g,h,i,null,null)}formScheduler.addEventListener("submit",submitScheduler),avatarInput.onchange=a=>{const b=new FileReader;b.onload=function(a){avatarPreview.src=a.target.result,avatarPreview.style.height="3rem",avatarPreview.style.marginTop="0.5rem"},b.readAsDataURL(a.target.files[0])},coverInput.onchange=a=>{const b=new FileReader;b.onload=function(a){coverPreview.src=a.target.result,coverPreview.style.height="3rem",coverPreview.style.marginTop="0.5rem"},b.readAsDataURL(a.target.files[0])};const createExtraSession=async(a,b)=>{const c=await fetch("https://seasonal-twitter.herokuapp.com/create-extraprofiles-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({uid:a,domain:`https://${window.location.hostname}`,quantity:b})});return await c.json()},createUnlimitedSession=async a=>{const b=await fetch("https://seasonal-twitter.herokuapp.com/create-unlimited-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({uid:a,domain:`https://${window.location.hostname}`})});return await b.json()},initStripeCheckout=a=>{buyExtraButton.addEventListener("click",()=>{const b=upgradeAmount.value;99<b&&(b=99),buyExtraButton.innerHTML="<div class=\"loader\"></div>",localStorage.clear(),createExtraSession(a,b).then(a=>{stripe.redirectToCheckout({sessionId:a.sessionId}).then(a=>{a.error?(displayError.style.display="block",displayError.textContent=a.error.message):(console.log("Added extra profiles!"),localStorage.clear())})})}),checkoutButton.addEventListener("click",()=>{checkoutButton.innerHTML="<div class=\"loader\"></div>",localStorage.clear(),createUnlimitedSession(a).then(a=>{stripe.redirectToCheckout({sessionId:a.sessionId}).then(a=>{a.error?(displayError.style.display="block",displayError.textContent=a.error.message):console.log("Upgraded to unlimited!")})})})};upgradeAmount.addEventListener("change",a=>{const b=document.getElementById("upgrade-amount-value");b.textContent=`${a.target.value}`});function setPro(){localStorage.setItem("pro","true"),accountType.textContent="Unlimited",accountType.style.color="#d4af37",upgradeBlock.style.display="none"}function toggleSignIn(){if(!firebase.auth().currentUser){const a=new firebase.auth.TwitterAuthProvider;firebase.auth().signInWithPopup(a).then(a=>{userData.accessToken=a.credential.accessToken,userData.accessTokenSecret=a.credential.secret,localStorage.setItem("accessToken",userData.accessToken),localStorage.setItem("accessTokenSecret",userData.accessTokenSecret);const b=a.user;userData.uid=b.uid,localStorage.setItem("uid",b.uid),userData.username="@"+a.additionalUserInfo.username,localStorage.setItem("username",a.additionalUserInfo.username),(async()=>{try{const a=await fetch("https://seasonal-twitter.herokuapp.com/save-user",{method:"POST",body:JSON.stringify(userData),headers:{"Content-Type":"application/json"}}),b=await a.json();console.log("Saving user success: ",b)}catch(a){console.error("Saving user error: ",a)}})(),screenName.textContent=userData.username}).catch(a=>{const b=a.code;"auth/account-exists-with-different-credential"===b?alert("You have already signed up with a different auth provider for that email."):console.error(a)})}else firebase.auth().signOut(),localStorage.clear(),location.reload(!0);twitterSignIn.disabled=!0}const getUser=async a=>{const b=new URL("https://seasonal-twitter.herokuapp.com/get-user");b.search=new URLSearchParams({uid:a});try{const a=await fetch(b,{method:"GET",headers:{"Content-Type":"application/json"}}),c=await a.json();return console.log("Getting user success: ",c),userData.uid=c.uid,userData.username=c.username,userData.accessToken=c.accessToken,userData.accessTokenSecret=c.accessTokenSecret,localStorage.setItem("signedIn","true"),localStorage.setItem("uid",c.uid),localStorage.setItem("username",c.username),localStorage.setItem("accessToken",c.accessToken),localStorage.setItem("accessTokenSecret",c.accessTokenSecret),c.extraProfiles&&(extraProfiles=c.extraProfiles,localStorage.setItem("extraProfiles",c.extraProfiles),accountType.textContent=`${2+c.extraProfiles}`),c.pro&&setPro(),!0}catch(a){return console.error("Getting user error: ",a),!1}},deleteProfile=async a=>{const b=document.getElementById(`profile-${a}`),c=b.innerHTML;b.style.background="#455362",b.innerHTML="<div class=\"loader\"></div>",b.className+=" grid-center";try{return await fetch("https://seasonal-twitter.herokuapp.com/delete-profile",{method:"POST",body:JSON.stringify({uid:userData.uid,dateTimeRef:a}),headers:{"Content-Type":"application/json"}}),console.log(`Successfully deleted ${a}`),removeElement(`profile-${a}`),localStorage.removeItem("scheduledProfilesLocal"),!0}catch(a){console.error("Deleting user error: ",a),b.style.background="var(--background)",b.innerHTML=c,b.classList.remove("grid-center")}},showProfiles=async a=>{const b=Object.keys(a);0<b.length&&(nonYet.style.display="none",b.map(b=>{const c=a[b];assets={cover:c.coverDownloadURL||"https://www.dropbox.com/s/xcvwn7h1ct1igzb/blank-cover.jpg?raw=1",avatar:c.avatarDownloadURL||"https://www.dropbox.com/s/t9xyl6s5egkdwn0/blank-avatar.jpg?raw=1",displayName:c.displayName||"",bio:c.bio||"",userLocation:c.userLocation||"",userWebsite:c.userWebsite||""};let d="<div></div>";""!==assets.userLocation&&(d=`
          <div class="card-location">
            <svg
              viewBox="0 0 24 24"
              width="18"
              style="fill: rgb(101, 119, 134)"
            >
              <g>
                <path
                  d="M12 14.315c-2.088 0-3.787-1.698-3.787-3.786S9.913 6.74 12 6.74s3.787 1.7 3.787 3.787-1.7 3.785-3.787 3.785zm0-6.073c-1.26 0-2.287 1.026-2.287 2.287S10.74 12.814 12 12.814s2.287-1.025 2.287-2.286S13.26 8.24 12 8.24z"
                ></path>
                <path
                  d="M20.692 10.69C20.692 5.9 16.792 2 12 2s-8.692 3.9-8.692 8.69c0 1.902.603 3.708 1.743 5.223l.003-.002.007.015c1.628 2.07 6.278 5.757 6.475 5.912.138.11.302.163.465.163.163 0 .327-.053.465-.162.197-.155 4.847-3.84 6.475-5.912l.007-.014.002.002c1.14-1.516 1.742-3.32 1.742-5.223zM12 20.29c-1.224-.99-4.52-3.715-5.756-5.285-.94-1.25-1.436-2.742-1.436-4.312C4.808 6.727 8.035 3.5 12 3.5s7.192 3.226 7.192 7.19c0 1.57-.497 3.062-1.436 4.313-1.236 1.57-4.532 4.294-5.756 5.285z"
                ></path>
              </g>
            </svg>
            <span style="margin-left: 0.5rem">${assets.userLocation}</span>
          </div>
        `);let e="<div></div>";""!==assets.userWebsite&&(e=`
          <div class="card-website">
            <svg
              viewBox="0 0 24 24"
              width="18"
              style="fill: rgb(101, 119, 134)"
            >
              <g>
                <path
                  d="M11.96 14.945c-.067 0-.136-.01-.203-.027-1.13-.318-2.097-.986-2.795-1.932-.832-1.125-1.176-2.508-.968-3.893s.942-2.605 2.068-3.438l3.53-2.608c2.322-1.716 5.61-1.224 7.33 1.1.83 1.127 1.175 2.51.967 3.895s-.943 2.605-2.07 3.438l-1.48 1.094c-.333.246-.804.175-1.05-.158-.246-.334-.176-.804.158-1.05l1.48-1.095c.803-.592 1.327-1.463 1.476-2.45.148-.988-.098-1.975-.69-2.778-1.225-1.656-3.572-2.01-5.23-.784l-3.53 2.608c-.802.593-1.326 1.464-1.475 2.45-.15.99.097 1.975.69 2.778.498.675 1.187 1.15 1.992 1.377.4.114.633.528.52.928-.092.33-.394.547-.722.547z"
                ></path>
                <path
                  d="M7.27 22.054c-1.61 0-3.197-.735-4.225-2.125-.832-1.127-1.176-2.51-.968-3.894s.943-2.605 2.07-3.438l1.478-1.094c.334-.245.805-.175 1.05.158s.177.804-.157 1.05l-1.48 1.095c-.803.593-1.326 1.464-1.475 2.45-.148.99.097 1.975.69 2.778 1.225 1.657 3.57 2.01 5.23.785l3.528-2.608c1.658-1.225 2.01-3.57.785-5.23-.498-.674-1.187-1.15-1.992-1.376-.4-.113-.633-.527-.52-.927.112-.4.528-.63.926-.522 1.13.318 2.096.986 2.794 1.932 1.717 2.324 1.224 5.612-1.1 7.33l-3.53 2.608c-.933.693-2.023 1.026-3.105 1.026z"
                ></path>
              </g>
            </svg>
            <a style="margin-left: 0.5rem; text-decoration: none">${assets.userWebsite}</a>
          </div>
        `);const f=userData.username||"",g=document.createElement("div");g.className="details scheduled-profile",g.id=`profile-${b}`,g.innerHTML=`
        <img
          class="card-cover"
          src="${assets.cover}"
          alt=""
        />
        <img
          class="card-avatar"
          src="${assets.avatar}"
          alt=""
        />
        <div class="card-displayname">${assets.displayName}</div>
        <div class="card-username">${f}</div>
        <div class="card-bio">${assets.bio}</div>
        ${d}
        ${e}
        <div class="card-dtblock">⇢ <span class="card-datetime">${b}</span></div>
        <div class="options">
          <a id="delete-${b}" class="delete" role="button" tab-index="0">Delete</a>
        </div>
      `,scheduledProfiles.appendChild(g)}),[...document.querySelectorAll("[id^=delete]")].forEach(a=>{a.addEventListener("click",a=>{if(confirm("Are you sure you want to delete this profile?")){const b=a.target.id.replace("delete-","");console.log(`Deleting ${b}...`),deleteProfile(b)}})}))},getProfiles=async a=>{console.log("Getting scheduled profiles from server...");const b=new URL("https://seasonal-twitter.herokuapp.com/get-profiles");b.search=new URLSearchParams({uid:a});try{const a=await fetch(b,{method:"GET",headers:{"Content-Type":"application/json"}}),c=await a.json();console.log("Getting user profiles success: ",c);return localStorage.setItem("scheduledProfilesLocal",JSON.stringify(c)),showProfiles(c),!0}catch(a){return console.error("Getting user profile error: ",a),!1}};function initApp(){firebase.auth().onAuthStateChanged(a=>{if(a){const b=localStorage.getItem("signedIn");isPro?(console.log("Pro account from local storage"),setPro(),scheduledProfilesLocal?showProfiles(JSON.parse(scheduledProfilesLocal)):getProfiles(a.uid)):b?(console.log("Basic account from local storage"),scheduledProfilesLocal?showProfiles(JSON.parse(scheduledProfilesLocal)):getProfiles(a.uid)):(getUser(a.uid),getProfiles(a.uid)),isPro||(accountType.innerHTML=`${2+ +extraProfiles}`),twitterPhoto.src=`https://unavatar.now.sh/${userData.username}?json`,twitterName.textContent=a.displayName,screenName.textContent=userData.username,signInStatus.textContent="Yes",signInStatus.style.color="#00cc08",profileBlock.style.display="block",signInID.textContent=a.uid,twitterSignIn.textContent="Sign out",twitterSignIn.style.background="#657786",scheduledProfiles.style.display="block",scheduleButton.style.cursor="pointer",scheduleButton.disabled=!1,-1<window.location.href.indexOf("unlimited")?setPro():-1<window.location.href.indexOf("cancel")?(initStripeCheckout(a.uid),displayError.style.display="block",displayError.textContent="Payment canceled."):initStripeCheckout(a.uid)}else signInStatus.textContent="No",signInStatus.style.color="red",signInID.textContent="",twitterSignIn.textContent="Sign in with Twitter",twitterSignIn.style.background="#1dcaff",profileBlock.style.display="none",scheduledProfiles.style.display="none",scheduleButton.style.cursor="not-allowed",scheduleButton.disabled=!0;twitterSignIn.disabled=!1}),twitterSignIn.addEventListener("click",toggleSignIn,!1)}document.getElementById("refresh").addEventListener("click",()=>{localStorage.clear(),location.reload(!0)}),window.onload=function(){initApp();const a=document.getElementById("ph-badge");a.src=window.matchMedia("(prefers-color-scheme: dark)").matches?"https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=179003&theme=dark&period=daily":"https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=179003&theme=light&period=daily",a.style.height="54px"};