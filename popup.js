// Listen for messages from the injected content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "exportProgress") {
      // Update live status
      if (document.getElementById("status")) {
        document.getElementById("status").innerText = `Exporting: ${message.progress}% (${message.friendCount} friends)`;
      }
    } else if (message.type === "exportComplete") {
      // Update status and reveal the download button
      if (document.getElementById("status")) {
        document.getElementById("status").innerText = `Export complete! ${message.friendCount} friends matched.`;
      }
      const downloadBtn = document.getElementById("download-btn");
      if (downloadBtn) {
        downloadBtn.style.display = "block";
        // Store CSV content on the button's dataset for later download
        downloadBtn.dataset.csv = message.csvContent;
      }
      // Hide spinner if present
      if (document.getElementById("spinner")) {
        document.getElementById("spinner").style.display = "none";
      }
    }
  });
  
  document.getElementById("run-script").addEventListener("click", async () => {
    // Reset UI elements.
    if (document.getElementById("spinner")) {
      document.getElementById("spinner").style.display = "block";
    }
    if (document.getElementById("status")) {
      document.getElementById("status").innerText = "Exporting: 0% (0 friends)";
    }
    // Hide the download button initially.
    const downloadBtn = document.getElementById("download-btn");
    if (downloadBtn) {
      downloadBtn.style.display = "none";
      downloadBtn.dataset.csv = "";
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: runFriendDataExtraction
    });
  });
  
  // When the download button is clicked, trigger the CSV download.
  document.getElementById("download-btn").addEventListener("click", () => {
    const csvContent = document.getElementById("download-btn").dataset.csv;
    if (!csvContent) return;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my_friends_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
  
  // This function is injected into the active tab.
  function runFriendDataExtraction() {
    // Ensure page load before starting.
    if (document.readyState !== "complete") {
      window.addEventListener("load", startProcess);
    } else {
      startProcess();
    }
  
    function startProcess() {
      console.log("Starting friend data extraction...");
  
      // --- Create an overlay with Snapchat-inspired styling ---
      const overlay = document.createElement("div");
      overlay.id = "friend-exporter-overlay";
      Object.assign(overlay.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "60px",
        backgroundColor: "#000",
        color: "#FFFC00",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "9999",
        fontFamily: "'Helvetica Neue', Arial, sans-serif"
      });
      overlay.innerHTML = `
        <div id="content-progress" style="font-size: 16px;">Progress: 0%</div>
        <div style="position: absolute; bottom: 5px; left: 5%; width: 90%; height: 6px; background: #333; border-radius: 3px;">
          <div id="content-progress-bar" style="width: 0%; height: 100%; background: #FFFC00; border-radius: 3px;"></div>
        </div>
      `;
      document.body.appendChild(overlay);
  
      // Step 1: Click the friend request button.
      const friendRequestButton = document.querySelector('button[title="View friend requests"]');
      if (friendRequestButton) {
        friendRequestButton.click();
        console.log("Friend request button clicked.");
      } else {
        console.error("Friend request button not found.");
        document.body.removeChild(overlay);
        return;
      }
  
      // Step 2: Wait and update the search input using XPath.
      setTimeout(() => {
        const xpath = '/html/body/main/div[1]/div[3]/div/div[2]/div/div/div[1]/div/div/input';
        const searchInput = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        if (searchInput) {
          try {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(searchInput, "a");
            const event = new Event('input', { bubbles: true });
            searchInput.dispatchEvent(event);
            console.log("Search text entered.");
          } catch (error) {
            console.error("Error updating search input:", error);
          }
        } else {
          console.error("Search input not found using XPath:", xpath);
        }
  
        // Step 3: Wait and then extract friend data from primary and feed containers.
        setTimeout(() => {
          // Use a Map to store friend data (keyed by username)
          const friendData = new Map();
  
          // Extract from primary container.
          function extractFromPrimary() {
            const primaryContainer = document.querySelector('.ReactVirtualized__Grid.ReactVirtualized__List.buksD');
            if (!primaryContainer) {
              console.error("Primary scroll container not found.");
              return;
            }
            const allCells = Array.from(document.querySelectorAll('div[role="gridcell"]'));
            const headerCell = allCells.find(cell => cell.textContent.includes("My Friends"));
            let headerBottom = 0;
            if (headerCell) {
              headerBottom = headerCell.getBoundingClientRect().bottom;
            } else {
              console.warn("My Friends header not found; processing all cells.");
            }
            allCells.forEach(cell => {
              const cellRect = cell.getBoundingClientRect();
              if (cellRect.top < headerBottom) return;
              const usernameEl = cell.querySelector('span.iQDcn.nonIntl');
              const fullnameEl = cell.querySelector('span.YifBM.nonIntl');
              const imgEl = cell.querySelector('img.Dozhe');
              if (usernameEl && fullnameEl && imgEl) {
                const username = usernameEl.textContent.trim();
                const fullname = fullnameEl.textContent.trim();
                const picUrl = imgEl.getAttribute("src");
                if (username && fullname && picUrl) {
                  friendData.set(username, { fullname, picUrl });
                }
              }
            });
            console.log("Primary container data collected:", Array.from(friendData.entries()));
          }
  
          // Extract from secondary feed container.
          function extractFromFeed() {
            const feedContainer = document.querySelector('.ReactVirtualized__Grid.ReactVirtualized__List.QAr02');
            if (!feedContainer) {
              console.warn("Feed container not found. Skipping feed extraction.");
              return;
            }
            const feedItems = Array.from(feedContainer.querySelectorAll('[role="listitem"]'));
            feedItems.forEach(item => {
              let username = "";
              let fullname = "";
              let picUrl = "";
              // Get all elements with class "nonIntl" and use the second one for the name.
              const nonIntlEls = item.querySelectorAll('.nonIntl');
              if (nonIntlEls.length >= 2) {
                username = nonIntlEls[1].textContent.trim();
                fullname = username; // For feed items, we use the same value.
              }
              // Profile picture: get any image element.
              const imgEl = item.querySelector('img');
              if (imgEl) {
                picUrl = imgEl.getAttribute("src");
              }
              if (username && picUrl) {
                friendData.set(username, { fullname, picUrl });
              }
            });
            console.log("Feed container data collected:", Array.from(friendData.entries()));
          }
  
          // Scroll the primary container to load data.
          const primaryContainer = document.querySelector('.ReactVirtualized__Grid.ReactVirtualized__List.buksD');
          if (!primaryContainer) {
            console.error("Primary scroll container not found.");
            document.body.removeChild(overlay);
            return;
          }
          let lastScrollTop = 0;
          const scrollStep = 50;
          const intervalDelay = 200;
          const progressBar = document.getElementById("content-progress-bar");
          const progressText = document.getElementById("content-progress");
  
          const scrollInterval = setInterval(() => {
            primaryContainer.scrollTop += scrollStep;
            extractFromPrimary();
  
            const progressPercent = Math.min(
              (primaryContainer.scrollTop / (primaryContainer.scrollHeight - primaryContainer.clientHeight)) * 100,
              100
            );
            if (progressBar) {
              progressBar.style.width = `${progressPercent}%`;
            }
            if (progressText) {
              progressText.innerText = `Progress: ${Math.floor(progressPercent)}%`;
            }
  
            if (
              primaryContainer.scrollTop + primaryContainer.clientHeight >= primaryContainer.scrollHeight - 10 ||
              primaryContainer.scrollTop === lastScrollTop
            ) {
              clearInterval(scrollInterval);
              extractFromPrimary(); // Final extraction from primary container
              extractFromFeed();    // Extraction from feed container
  
              // --- Step 4: Extract data from the nav container ---
              const navContainer = document.evaluate(
                '/html/body/main/div[1]/div[2]/nav/div[1]/div',
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;
              const navNames = new Set();
              if (navContainer) {
                let lastNavScrollTop = 0;
                const navScrollStep = 50;
                const navIntervalDelay = 200;
                const navScrollInterval = setInterval(() => {
                  navContainer.scrollTop += navScrollStep;
                  // For each nav item, get all elements with class "nonIntl" and pick the second one.
                  const navItems = Array.from(navContainer.querySelectorAll('div'));
                  navItems.forEach(item => {
                    const nonIntlEls = item.querySelectorAll('.nonIntl');
                    if (nonIntlEls.length >= 2) {
                      const name = nonIntlEls[1].textContent.trim();
                      if (name) navNames.add(name);
                    }
                  });
                  if (
                    navContainer.scrollTop + navContainer.clientHeight >= navContainer.scrollHeight - 10 ||
                    navContainer.scrollTop === lastNavScrollTop
                  ) {
                    clearInterval(navScrollInterval);
                    // Final pass to ensure all names are captured.
                    const finalItems = Array.from(navContainer.querySelectorAll('div'));
                    finalItems.forEach(item => {
                      const nonIntlEls = item.querySelectorAll('.nonIntl');
                      if (nonIntlEls.length >= 2) {
                        const name = nonIntlEls[1].textContent.trim();
                        if (name) navNames.add(name);
                      }
                    });
                    console.log("Nav container names collected:", Array.from(navNames));
                    // --- Filter friendData based on navNames using the friend's full name ---
                    friendData.forEach((value, key) => {
                      if (!navNames.has(value.fullname)) {
                        friendData.delete(key);
                      }
                    });
                    console.log("Filtered friend data:", Array.from(friendData.entries()));
                    
                    // Build CSV.
                    const csvHeader = "friend_username,friend_fullname,friend_image";
                    const rows = Array.from(friendData.entries()).map(([username, data]) => {
                      return `"${username}","${data.fullname}","${data.picUrl}"`;
                    });
                    const csvContent = `${csvHeader}\n${rows.join("\n")}`;
                    
                    // Instead of auto-downloading, send the CSV content back to the popup.
                    if (chrome.runtime && chrome.runtime.sendMessage) {
                      chrome.runtime.sendMessage({
                        type: "exportComplete",
                        friendCount: friendData.size,
                        csvContent: csvContent
                      });
                    }
                    
                    // Remove overlay.
                    setTimeout(() => {
                      if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                      }
                    }, 1000);
                  } else {
                    lastNavScrollTop = navContainer.scrollTop;
                  }
                }, navIntervalDelay);
              } else {
                console.warn("Nav container not found. No filtering will be done.");
                // Proceed with unfiltered data.
                const csvHeader = "friend_username,friend_fullname,friend_image";
                const rows = Array.from(friendData.entries()).map(([username, data]) => {
                  return `"${username}","${data.fullname}","${data.picUrl}"`;
                });
                const csvContent = `${csvHeader}\n${rows.join("\n")}`;
                if (chrome.runtime && chrome.runtime.sendMessage) {
                  chrome.runtime.sendMessage({
                    type: "exportComplete",
                    friendCount: friendData.size,
                    csvContent: csvContent
                  });
                }
                setTimeout(() => {
                  if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                  }
                }, 1000);
              }
            } else {
              lastScrollTop = primaryContainer.scrollTop;
            }
            // Optionally, send live progress updates.
            if (chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({
                type: "exportProgress",
                progress: Math.floor((primaryContainer.scrollTop / (primaryContainer.scrollHeight - primaryContainer.clientHeight)) * 100),
                friendCount: friendData.size
              });
            }
          }, intervalDelay);
        }, 1000);
      }, 1000);
    }
  }
  