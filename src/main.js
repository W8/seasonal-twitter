// Global user data
const userData = {
  uid: localStorage.getItem("uid") || null,
  accessToken: localStorage.getItem("accessToken") || null,
  accessTokenSecret: localStorage.getItem("accessTokenSecret") || null,
  username: localStorage.getItem("username") || null,
};

const isPro = localStorage.getItem("pro") || false;
let extraProfiles = localStorage.getItem("extraProfiles") || null;

const scheduledProfilesLocal =
  localStorage.getItem("scheduledProfilesLocal") || null;

// Global elements
const illustration = document.getElementById("illo");
const twitterSignIn = document.getElementById("quickstart-sign-in");

const profileBlock = document.getElementById("profile-block");
const signInStatus = document.getElementById("quickstart-sign-in-status");
const signInID = document.getElementById("quickstart-sign-in-id");
const twitterPhoto = document.getElementById("photo");
const twitterName = document.getElementById("display-name");
const screenName = document.getElementById("screen-name");
const accountType = document.getElementById("account-type");
const upgradeAmount = document.getElementById("upgrade-amount");
const buyExtraButton = document.getElementById("buy-extra-button");
const checkoutButton = document.getElementById("checkout-button");
const displayError = document.getElementById("error-message");
const upgradeBlock = document.getElementsByClassName("upgrade-block")[0];

const formScheduler = document.getElementById("schedule-form");
const scheduleButton = document.getElementById("set-button");
const formElements = document.getElementById("form-elements");
const month = document.getElementById("month");
const day = document.getElementById("day");
const time = document.getElementById("time");
let userNameInput = document.getElementById("name-input");
let userBioInput = document.getElementById("bio-input");
let userLocationInput = document.getElementById("location-input");
let userURLInput = document.getElementById("website-input");
const avatarInput = document.getElementById("avatar");
const coverInput = document.getElementById("cover");
const avatarPreview = document.getElementById("avatar-preview");
const coverPreview = document.getElementById("cover-preview");

const scheduledProfiles = document.getElementById("scheduled-profiles");
const nonYet = document.getElementById("none-yet");

// Global variables
const stripe = Stripe("pk_live_61ikliwEju05QhOzh3Sej8mL");

// Global helper functions
function removeElement(id) {
  const elem = document.getElementById(id);
  return elem.parentNode.removeChild(elem);
}

// Redirect to web.app
if (window.location.href.indexOf("firebase") > -1) {
  window.location.replace("https://seasonal-twitter.web.app");
}

// Get prefers-color-scheme media query
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const prefersLight = window.matchMedia("(prefers-color-scheme: light)");

const browserDate = new Date();
const browserMonth = browserDate.getMonth();

if (prefersDark.matches) {
  illustration.src =
    browserMonth === 6
      ? "illo-pride.png"
      : browserMonth === 10
      ? "illo-hallo-white.png"
      : "illo-white.png";
} else if (prefersLight.matches) {
  illustration.src =
    browserMonth === 6
      ? "illo-pride.png"
      : browserMonth === 10
      ? "illo-hallo-black.png"
      : "illo-black.png";
} else {
  illustration.src =
    browserMonth === 6
      ? "illo-pride.png"
      : browserMonth === 10
      ? "illo-hallo.png"
      : "illo.png";
}

prefersDark.addListener((e) => {
  if (e.matches) {
    illustration.src = "illo-white.png";
  }
});

prefersLight.addListener((e) => {
  if (e.matches) {
    illustration.src = "illo-black.png";
  }
});

// Submit Form stuff
function startLoading() {
  // Start loader
  scheduleButton.innerHTML = '<div class="loader"></div>';
  scheduleButton.style.cursor = "not-allowed";
  scheduleButton.disabled = true;

  // Remove form inputs
  formElements.style.visibility = "hidden";
  formElements.style.position = "absolute";
}

async function stopLoading() {
  // Stop loader
  scheduleButton.innerHTML = "Schedule Yearly";
  scheduleButton.style.cursor = "pointer";
  scheduleButton.disabled = false;

  // Add back form inputs
  formElements.removeAttribute("style");
}

async function formReset() {
  formScheduler.reset();
  avatarPreview.removeAttribute("src");
  coverPreview.removeAttribute("src");
}

async function uploadToServer(compressedFile, storageRef) {
  console.log("Uplading image to server...");

  try {
    const uploadTask = await storageRef.put(compressedFile);
    const downloadURL = await uploadTask.ref.getDownloadURL();
    return downloadURL;
  } catch {
    throw new Error("Error uploading image and getting download url...");
  }
}

async function handleImageUpload(imageFile, storageRef, maxSizeMB, maxWidth) {
  var options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: maxWidth,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(imageFile, options);
    const fileDownloadUrl = await uploadToServer(compressedFile, storageRef);
    return fileDownloadUrl;
  } catch (error) {
    console.log(error);
    throw new Error("Error: " + error);
  }
}

async function handleAddProfile(
  selectedDateAndTime,
  displayName,
  bio,
  userLocation,
  userWebsite,
  avatarDownloadURL,
  coverDownloadURL
) {
  const scheduledMonth = selectedDateAndTime.userMonth;
  const scheduledDay = selectedDateAndTime.userDay;
  const scheduledTime = selectedDateAndTime.userTime;
  const scheduledProfile = {
    uid: userData.uid,
    accessToken: userData.accessToken,
    accessTokenSecret: userData.accessTokenSecret,
    displayName,
    bio,
    userLocation,
    userWebsite,
    avatarDownloadURL,
    coverDownloadURL,
  };

  const profileData = {
    scheduledMonth,
    scheduledDay,
    scheduledTime,
    scheduledProfile,
  };

  try {
    (async () => {
      try {
        const response = await fetch(
          "https://seasonal-twitter.herokuapp.com/add-profile",
          {
            method: "POST",
            body: JSON.stringify(profileData),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response === "Adding profile failed: no more available") {
          throw new Error("No more available profiles.");
        }

        const jsonResponse = await response.json();
        console.log("Adding schedule profile success: ", jsonResponse);
        localStorage.clear();
        location.reload(true);
      } catch (error) {
        alert(
          `There was an error adding this scheduled profile: You may have reached your limit.`
        );
        console.log("Saving scheduled profile error: " + error);
      } finally {
        stopLoading();
        formReset();
      }
    })();
  } catch {
    throw error("Error: unable to add scheduled profile.");
  }
}

async function submitScheduler(event) {
  event.preventDefault();

  startLoading();

  // Get all form inputs

  let userMonth = month.options[month.selectedIndex].value;
  userMonth === "Month" && (userMonth = null);

  let userDay = day.options[day.selectedIndex].value;
  userDay === "Day" && (userDay = null);

  let userTime = time.options[time.selectedIndex].text;
  userTime === "Time (UTC)" && (userTime = null);

  const selectedDateAndTime = {
    userMonth,
    userDay,
    userTime,
  };

  if (userMonth === null || userDay === null || userTime === null) {
    stopLoading();
    alert("Date and time is required to schedule a profile.");
    return;
  }

  let userDisplayName = userNameInput.value;
  let bioDisplayName = userBioInput.value;
  let locationDisplayName = userLocationInput.value;
  let websiteDisplayName = userURLInput.value;

  if (userDisplayName === "") {
    userDisplayName = null;
  } else if (userDisplayName.toLowerCase().includes("twitter")) {
    stopLoading();
    alert('Display name can\'t include the word "Twitter"');
    return;
  }

  if (bioDisplayName === "") {
    bioDisplayName = null;
  }

  if (locationDisplayName === "") {
    locationDisplayName = null;
  }

  if (websiteDisplayName === "") {
    websiteDisplayName = null;
  }

  const avatarStorageRef = firebase
    .storage()
    .ref(`${userMonth}-${userDay}-${userTime}/avatars/${userData.uid}`);
  const coverStorageRef = firebase
    .storage()
    .ref(`${userMonth}-${userDay}-${userTime}/covers/${userData.uid}`);

  const avatar = avatarInput.files[0];
  const cover = coverInput.files[0];

  if (
    !userDisplayName &&
    !bioDisplayName &&
    !locationDisplayName &&
    !websiteDisplayName &&
    !avatar &&
    !cover
  ) {
    stopLoading();
    alert(
      "At least one of the following is required to schedule a profile: name, bio, location, url, avatar, cover photo"
    );
    return;
  }

  if (avatar && cover) {
    const avatarDownloadURL = await handleImageUpload(
      avatar,
      avatarStorageRef,
      0.7,
      400
    );
    const coverDownloadURL = await handleImageUpload(
      cover,
      coverStorageRef,
      2,
      1500
    );

    await handleAddProfile(
      selectedDateAndTime,
      userDisplayName,
      bioDisplayName,
      locationDisplayName,
      websiteDisplayName,
      avatarDownloadURL,
      coverDownloadURL
    );
  } else if (avatar) {
    const avatarDownloadURL = await handleImageUpload(
      avatar,
      avatarStorageRef,
      0.7,
      400
    );

    await handleAddProfile(
      selectedDateAndTime,
      userDisplayName,
      bioDisplayName,
      locationDisplayName,
      websiteDisplayName,
      avatarDownloadURL,
      null
    );
  } else if (cover) {
    const coverDownloadURL = await handleImageUpload(
      cover,
      coverStorageRef,
      2,
      1500
    );

    await handleAddProfile(
      selectedDateAndTime,
      userDisplayName,
      bioDisplayName,
      locationDisplayName,
      websiteDisplayName,
      null,
      coverDownloadURL
    );
  } else {
    await handleAddProfile(
      selectedDateAndTime,
      userDisplayName,
      bioDisplayName,
      locationDisplayName,
      websiteDisplayName,
      null,
      null
    );
  }
}

// Listen to schedule profile form submission
formScheduler.addEventListener("submit", submitScheduler);

// Preview images on form
avatarInput.onchange = (event) => {
  const reader = new FileReader();

  reader.onload = function (e) {
    // get loaded data and render thumbnail.
    avatarPreview.src = e.target.result;
    avatarPreview.style.height = "3rem";
    avatarPreview.style.marginTop = "0.5rem";
  };

  // read the image file as a data URL.
  reader.readAsDataURL(event.target.files[0]);
};

coverInput.onchange = (event) => {
  const reader = new FileReader();

  reader.onload = function (e) {
    // get loaded data and render thumbnail.
    coverPreview.src = e.target.result;
    coverPreview.style.height = "3rem";
    coverPreview.style.marginTop = "0.5rem";
  };

  // read the image file as a data URL.
  reader.readAsDataURL(event.target.files[0]);
};

/** STRIPE CHECKOUT STUFF */
const createExtraSession = async (uid, quantity) => {
  const result = await fetch(
    "https://seasonal-twitter.herokuapp.com/create-extraprofiles-session",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: uid,
        domain: `https://${window.location.hostname}`,
        quantity: quantity,
      }),
    }
  );
  return await result.json();
};

const createUnlimitedSession = async (uid) => {
  const result = await fetch(
    "https://seasonal-twitter.herokuapp.com/create-unlimited-session",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: uid,
        domain: `https://${window.location.hostname}`,
      }),
    }
  );
  return await result.json();
};

const initStripeCheckout = (uid) => {
  buyExtraButton.addEventListener("click", () => {
    const quantity = upgradeAmount.value;

    if (quantity > 99) {
      quantity = 99;
    }

    // Add loader
    buyExtraButton.innerHTML = '<div class="loader"></div>';

    // Clear local storage
    localStorage.clear();

    // When the customer clicks on the button, redirect
    // them to Checkout.
    createExtraSession(uid, quantity).then((data) => {
      stripe
        .redirectToCheckout({
          sessionId: data.sessionId,
        })
        .then((result) => {
          if (result.error) {
            // If `redirectToCheckout` fails due to a browser or network
            // error, display the localized error message to your customer.
            displayError.style.display = "block";
            displayError.textContent = result.error.message;
          } else {
            console.log("Added extra profiles!");
            // Clear local storage
            localStorage.clear();
          }
        });
    });
  });

  checkoutButton.addEventListener("click", () => {
    // Add loader
    checkoutButton.innerHTML = '<div class="loader"></div>';

    // Clear local storage
    localStorage.clear();

    // When the customer clicks on the button, redirect
    // them to Checkout.
    createUnlimitedSession(uid).then((data) => {
      stripe
        .redirectToCheckout({
          sessionId: data.sessionId,
        })
        .then((result) => {
          if (result.error) {
            // If `redirectToCheckout` fails due to a browser or network
            // error, display the localized error message to your customer.
            displayError.style.display = "block";
            displayError.textContent = result.error.message;
          } else {
            console.log("Upgraded to unlimited!");
          }
        });
    });
  });
};

// Add more profiles input lsitener
upgradeAmount.addEventListener("change", (event) => {
  const upgradeAmountValue = document.getElementById("upgrade-amount-value");
  upgradeAmountValue.textContent = `${event.target.value}`;
});

// Set Pro Function
function setPro() {
  localStorage.setItem("pro", "true");
  accountType.textContent = "Unlimited";
  accountType.style.color = "#d4af37";
  upgradeBlock.style.display = "none";
}

/**
 * Function called when clicking the Login/Logout button.
 */
// [START buttoncallback]
function toggleSignIn() {
  if (!firebase.auth().currentUser) {
    // [START createprovider]
    const provider = new firebase.auth.TwitterAuthProvider();
    // [END createprovider]
    // [START signin]
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        // This gives you a the Twitter OAuth 1.0 Access Token and Secret.
        // You can use these server side with your app's credentials to access the Twitter API.
        userData.accessToken = result.credential.accessToken;
        userData.accessTokenSecret = result.credential.secret;

        localStorage.setItem("accessToken", userData.accessToken);
        localStorage.setItem("accessTokenSecret", userData.accessTokenSecret);

        // console.log("access token: " + token);
        // console.log("access token secret: " + tokenSecret);

        // The signed-in user info.
        const twitterUser = result.user;

        userData.uid = twitterUser.uid;
        localStorage.setItem("uid", twitterUser.uid);

        userData.username = "@" + result.additionalUserInfo.username;
        localStorage.setItem("username", result.additionalUserInfo.username);

        // [START_EXCLUDE]
        (async () => {
          try {
            const response = await fetch(
              "https://seasonal-twitter.herokuapp.com/save-user",
              {
                method: "POST",
                body: JSON.stringify(userData),
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            const jsonResponse = await response.json();
            console.log("Saving user success: ", jsonResponse);
          } catch (error) {
            console.error("Saving user error: ", error);
          }
        })();

        screenName.textContent = userData.username;

        // [END_EXCLUDE]
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        // const errorMessage = error.message;
        // const email = error.email;
        // const credential = error.credential;

        // [START_EXCLUDE]
        if (errorCode === "auth/account-exists-with-different-credential") {
          alert(
            "You have already signed up with a different auth provider for that email."
          );
          // If you are using multiple auth providers on your app you should handle linking
          // the user's accounts here.
        } else {
          console.error(error);
        }
        // [END_EXCLUDE]
      });
    // [END signin]
  } else {
    // [START signout]
    firebase.auth().signOut();
    localStorage.clear();
    location.reload(true);
    // [END signout]
  }
  // [START_EXCLUDE]
  twitterSignIn.disabled = true;
  // [END_EXCLUDE]
}
// [END buttoncallback]

// Get User Details
const getUser = async (uid) => {
  const url = new URL("https://seasonal-twitter.herokuapp.com/get-user");
  url.search = new URLSearchParams({ uid: uid });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseJson = await response.json();
    console.log("Getting user success: ", responseJson);

    userData.uid = responseJson.uid;
    userData.username = responseJson.username;
    userData.accessToken = responseJson.accessToken;
    userData.accessTokenSecret = responseJson.accessTokenSecret;

    localStorage.setItem("signedIn", "true");
    localStorage.setItem("uid", responseJson.uid);
    localStorage.setItem("username", responseJson.username);
    localStorage.setItem("accessToken", responseJson.accessToken);
    localStorage.setItem("accessTokenSecret", responseJson.accessTokenSecret);

    if (responseJson.extraProfiles) {
      extraProfiles = responseJson.extraProfiles;
      localStorage.setItem("extraProfiles", responseJson.extraProfiles);
      accountType.textContent = `${2 + responseJson.extraProfiles}`;
    }

    if (responseJson.pro) {
      setPro();
    }

    return true;
  } catch (error) {
    console.error("Getting user error: ", error);

    return false;
  }
};

// Delete User Scheduled Profile
const deleteProfile = async (id) => {
  const profileDeleting = document.getElementById(`profile-${id}`);
  const previousInnerHTML = profileDeleting.innerHTML;
  profileDeleting.style.background = "#455362";
  profileDeleting.innerHTML = '<div class="loader"></div>';
  profileDeleting.className += " grid-center";

  try {
    await fetch("https://seasonal-twitter.herokuapp.com/delete-profile", {
      method: "POST",
      body: JSON.stringify({
        uid: userData.uid,
        dateTimeRef: id,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`Successfully deleted ${id}`);
    removeElement(`profile-${id}`);
    localStorage.removeItem("scheduledProfilesLocal");
    return true;
  } catch (error) {
    console.error("Deleting user error: ", error);
    profileDeleting.style.background = "var(--background)";
    profileDeleting.innerHTML = previousInnerHTML;
    profileDeleting.classList.remove("grid-center");
  }
};

// Show User Scheduled Profiles
const showProfiles = async (json) => {
  const scheduleProfilesArray = Object.keys(json);

  if (scheduleProfilesArray.length > 0) {
    nonYet.style.display = "none";

    scheduleProfilesArray.map((key) => {
      const scheduledProfile = json[key];
      assets = {
        cover:
          scheduledProfile.coverDownloadURL ||
          "https://www.dropbox.com/s/xcvwn7h1ct1igzb/blank-cover.jpg?raw=1",
        avatar:
          scheduledProfile.avatarDownloadURL ||
          "https://www.dropbox.com/s/t9xyl6s5egkdwn0/blank-avatar.jpg?raw=1",
        displayName: scheduledProfile.displayName || "",
        bio: scheduledProfile.bio || "",
        userLocation: scheduledProfile.userLocation || "",
        userWebsite: scheduledProfile.userWebsite || "",
      };

      let userLocationDiv = "<div></div>";
      if (assets.userLocation !== "") {
        userLocationDiv = `
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
        `;
      }

      let userWebsiteDiv = "<div></div>";
      if (assets.userWebsite !== "") {
        userWebsiteDiv = `
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
        `;
      }

      const usernameProfile = userData.username || "";

      const profile = document.createElement("div");
      profile.className = "details scheduled-profile";
      profile.id = `profile-${key}`;
      profile.innerHTML = `
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
        <div class="card-username">${usernameProfile}</div>
        <div class="card-bio">${assets.bio}</div>
        ${userLocationDiv}
        ${userWebsiteDiv}
        <div class="card-dtblock">⇢ <span class="card-datetime">${key}</span></div>
        <div class="options">
          <a id="delete-${key}" class="delete" role="button" tab-index="0">Delete</a>
        </div>
      `;
      scheduledProfiles.appendChild(profile);
    });

    [...document.querySelectorAll("[id^=delete]")].forEach((item) => {
      item.addEventListener("click", (event) => {
        if (confirm("Are you sure you want to delete this profile?")) {
          const id = event.target.id.replace("delete-", "");
          console.log(`Deleting ${id}...`);
          deleteProfile(id);
        }
      });
    });
  }
};

// Get User Scheduled Profile Details
const getProfiles = async (uid) => {
  console.log("Getting scheduled profiles from server...");

  const url = new URL("https://seasonal-twitter.herokuapp.com/get-profiles");
  url.search = new URLSearchParams({ uid: uid });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseJson = await response.json();
    console.log("Getting user profiles success: ", responseJson);

    const scheduledProfileDB = responseJson;

    localStorage.setItem(
      "scheduledProfilesLocal",
      JSON.stringify(responseJson)
    );

    showProfiles(scheduledProfileDB);

    return true;
  } catch (error) {
    console.error("Getting user profile error: ", error);

    return false;
  }
};

/**
 * initApp handles setting up UI event listeners and registering Firebase auth listener:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
function initApp() {
  // Listening for auth state changes.
  // [START authstatelistener]
  firebase.auth().onAuthStateChanged((twitterUser) => {
    if (twitterUser) {
      // User is signed in.
      const signedInBefore = localStorage.getItem("signedIn");

      if (isPro) {
        console.log("Pro account from local storage");
        setPro();
        if (scheduledProfilesLocal) {
          showProfiles(JSON.parse(scheduledProfilesLocal));
        } else {
          getProfiles(twitterUser.uid);
        }
      } else if (signedInBefore) {
        console.log("Basic account from local storage");
        if (scheduledProfilesLocal) {
          showProfiles(JSON.parse(scheduledProfilesLocal));
        } else {
          getProfiles(twitterUser.uid);
        }
      } else {
        getUser(twitterUser.uid);
        getProfiles(twitterUser.uid);
      }

      if (!isPro) {
        accountType.innerHTML = `${2 + Number(extraProfiles)}`;
      }

      // [START_EXCLUDE]
      twitterPhoto.src = `https://api.microlink.io/?url=https://twitter.com/${userData.username}&embed=image.url`;
      twitterName.textContent = twitterUser.displayName;
      screenName.textContent = userData.username;
      signInStatus.textContent = "Yes";
      signInStatus.style.color = "#00cc08";
      profileBlock.style.display = "block";
      signInID.textContent = twitterUser.uid;
      twitterSignIn.textContent = "Sign out";
      twitterSignIn.style.background = "#657786";
      scheduledProfiles.style.display = "block";
      scheduleButton.style.cursor = "pointer";
      scheduleButton.disabled = false;

      if (window.location.href.indexOf("unlimited") > -1) {
        // const sessionID = urlParams.get("session_id");
        setPro();
      } else if (window.location.href.indexOf("cancel") > -1) {
        initStripeCheckout(twitterUser.uid);

        displayError.style.display = "block";
        displayError.textContent = "Payment canceled.";
      } else {
        initStripeCheckout(twitterUser.uid);
      }

      // [END_EXCLUDE]
    } else {
      // User is signed out.
      // [START_EXCLUDE]
      signInStatus.textContent = "No";
      signInStatus.style.color = "red";
      signInID.textContent = "";
      twitterSignIn.textContent = "Sign in with Twitter";
      twitterSignIn.style.background = "#1dcaff";
      profileBlock.style.display = "none";
      scheduledProfiles.style.display = "none";
      scheduleButton.style.cursor = "not-allowed";
      scheduleButton.disabled = true;

      // [END_EXCLUDE]
    }
    // [START_EXCLUDE]
    twitterSignIn.disabled = false;
    // [END_EXCLUDE]
  });
  // [END authstatelistener]
  twitterSignIn.addEventListener("click", toggleSignIn, false);
}

document.getElementById("refresh").addEventListener("click", () => {
  localStorage.clear();
  location.reload(true);
});

window.onload = function () {
  initApp();

  const phBadge = document.getElementById("ph-badge");

  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    phBadge.src =
      "https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=179003&theme=dark&period=daily";
  } else {
    phBadge.src =
      "https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=179003&theme=light&period=daily";
  }

  phBadge.style.height = "54px";
};
