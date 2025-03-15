A Chrome extension that extracts friend data from Snapchat Web, filters the data based on navigation information, and lets you download the results as a CSV file. The extension features a Snapchat-inspired UI with an animated progress overlay and a download button that appears when the export is ready.

## Demo

<img width="500" alt="Screenshot 2025-03-15 at 7 02 03 PM" src="https://github.com/user-attachments/assets/90e2f0fd-bd92-4279-a6bd-9589c370ffa1" />
<img width="500" alt="Screenshot 2025-03-15 at 7 02 35 PM" src="https://github.com/user-attachments/assets/cb54b65d-5a98-40ca-89f6-f6b06a48e36d" />
<img width="500" alt="Screenshot 2025-03-15 at 7 03 00 PM" src="https://github.com/user-attachments/assets/f9d4b8d9-7f2d-4a71-b205-1caa33d30a6a" />

## Features

- **Data Extraction:**  
  - Clicks the friend request button and updates the search input automatically.
  - Scrolls the primary friend container and the secondary feed container to extract data (username, full name, profile picture).
  
- **Filtering Mechanism:**  
  - Extracts names from the navigation area (using a specified XPath) by selecting the second element with the class `nonIntl` from each nav item.
  - Filters the collected friend data to keep only the entries whose full name matches one of the names found in the navigation container.
  
- **CSV Generation & Download:**  
  - Generates a CSV file containing the username, full name, and profile picture URL.
  - A download button appears in the popup UI once the extraction and filtering process is complete, allowing you to download the CSV.

- **Interactive UI:**  
  - Progressive design with a yellow and black theme.
  - Animated spinner and progress bar show live export status.
  - Messaging between the content script and popup updates the UI in real time.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/bukhtyarhaider/snapchat-friend-exporter.git
   cd snapchat-friend-exporter
   ```

2. **Load the Extension in Chrome:**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in the top right corner).
   - Click **Load unpacked** and select the directory where you cloned the repository.

## File Structure

- **manifest.json:**  
  Contains the extension's configuration, permissions, and details for the Chrome extension.

- **popup.html:**  
  The HTML file that defines the extension's popup UI. It uses Snapchat-inspired styles and contains a hidden download button that is revealed upon export completion.

- **popup.js:**  
  The main JavaScript file that contains the logic for:
  - Extracting friend data from the Snapchat Web page.
  - Filtering the data based on the navigation container.
  - Generating the CSV file.
  - Communicating with the popup UI via messaging to update progress and display the download button.

- **README.md:**  
  This file, which provides detailed instructions and information about the project.

- **Image Files:**  
  Include any images such as `snapchat_logo.png` and icon files (e.g., `icon-16.png`, `icon-48.png`, `icon-128.png`) in the project root.

## Usage

1. **Open Snapchat Web:**
   - Navigate to [https://www.snapchat.com/web/](https://www.snapchat.com/web/) in your Chrome browser.

2. **Run the Export:**
   - Click the extension icon to open the popup UI.
   - Click the **Run Script** button to start the export process.
   - The popup will show a progress bar and spinner indicating the extraction status.
   - Once the extraction is complete and the data is filtered, a **Download CSV** button will appear.
   - Click the download button to save the CSV file containing the matched friend data.

## Contributing

Contributions are welcome! If you have ideas for improvements or bug fixes, please fork the repository and submit a pull request.

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Commit your changes with clear and descriptive commit messages.
4. Push your branch and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- Inspired by Snapchat's design and functionality.
- Special thanks to the open-source community for providing guidance and examples on building Chrome extensions.

---

Feel free to customize the README to reflect additional project details or your personal style.
