**Framework Backend Integration - Figma Plugin**
This Figma plugin is designed to integrate with the Framework Backend API to enable real-time collaboration and synchronization of design data. The plugin monitors changes in the Figma design and communicates with the backend to update and synchronize data.

Configuration
Before using the plugin, ensure that the BACKENDURL constant is set to the correct backend API endpoint. Currently, it is set to:

```javascript
Copy code
const BACKENDURL = "https://framework-backend.fly.dev/api";
You may need to update it based on your backend API configuration.
```

Functionality
The plugin performs the following main tasks:

**_Polling for Design Changes:_**

The plugin continuously polls the backend API to check for any changes in the Figma design.
The polling interval is set by the POLL_INTERVAL constant (currently set to 1000 milliseconds).
Fetching Design Changes:

When a change in the design is detected, the plugin makes an API call to the backend to fetch details about the design changes.
The backend responds with a Design object, indicating whether the design has changed and additional properties if needed.

**_Processing Design Changes:_**

If the design has changed, the plugin processes the changes by calling the makeChangement function.
The makeChangement function performs various tasks, such as editing variables, replacing images, and handling non-visible empty text.
Editing Variables:

The editVariables function edits variables in the Figma design based on the information received from the backend.
It filters local variables by type and updates their values.
Replacing Images:

The findImgAndReplace function replaces images in the Figma design based on the information received from the backend.
It locates nodes with matching names and updates their fills with new images.
Setting Non-Visible Empty Text:

The settingNonVisibleEmptyText function hides text elements with empty or space characters to ensure cleaner designs.
Creating or Updating Design on Backend:

The plugin fetches client information from the backend to display in the user interface.
When a user initiates the creation or update of a design, the plugin calls the createOrUpdateDesign function.
This function sends a POST request to the backend API to create or update the design based on the provided data.
UI Interaction:

The plugin creates a user interface with client information and handles messages from the UI, allowing users to trigger design creation or update.

**Windows Configuration**

Since the plugin is designed to run on a windows, you need to also to :

- Install Move Mouse to run the reloadplugin.ps1 every 30secondes
- Install PowerToy to edit a keyboard shortcut
- Configure Windows to prevent it to go to sleep/lock
