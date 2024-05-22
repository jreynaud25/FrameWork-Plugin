//const BACKENDURL = "http://localhost:3000/api";
const BACKENDURL = "https://framework-backend.fly.dev/api";
let datas = {
  FigmaName: figma.root.name,
  FigmaFileKey: figma.fileKey,
  FigmaId: figma.currentPage.id,
  sections: [],
  images: [],
  variables: [],
  usedBy: {},
};

let pollTimeoutId: number | undefined;
//Function to make API call to check if there is any change
const POLL_INTERVAL = 1000; // Configurable polling interval

let changeDesignStatus;
interface Design {
  hasChanged: boolean;
  // Add other properties of 'design' object here if needed
}

const fetchDesignChange = async (): Promise<Design> => {
  try {
    changeDesignStatus = await fetch(
      `${BACKENDURL}/figma/${datas.FigmaFileKey}/change`
    );

    if (!changeDesignStatus.ok) {
      // Check for error status codes (e.g., 404, 500)
      console.error(
        "Error response from server:",
        changeDesignStatus.status,
        changeDesignStatus.statusText
      );
      throw new Error(
        `Failed to fetch design change. Server returned status ${changeDesignStatus.status}`
      );
    }

    const responseData = await changeDesignStatus.json();
    return responseData;
  } catch (error) {
    console.error(
      "An error occurred during fetchDesignChange:",
      error.message || error
    );
    throw new Error("Failed to fetch design change.");
  }
};

const processDesignChange = async (design: Design): Promise<void> => {
  try {
    if (design.hasChanged) {
      console.log("Change detected!", design);
      await makeChangement(design);
    } else {
      console.log("No change detected");
    }
  } catch (error) {
    console.error("An error occurred during processDesignChange:", error);
    await fetch(`${BACKENDURL}/figma/error`);
    throw new Error("Failed to process design change.");
  }
};

const checkIfChanged = async (): Promise<void> => {
  //console.log("Checking if design has changed");
  try {
    const design = await fetchDesignChange();
    await processDesignChange(design);
  } catch (error) {
    await fetch(`${BACKENDURL}/figma/error`);
    console.error("An error occurred while making the API call:", error);
  } finally {
    if (datas.FigmaFileKey) {
      pollTimeoutId = setTimeout(checkIfChanged, POLL_INTERVAL);
    }
  }
};

const clearPollTimeout = (): void => {
  try {
    if (pollTimeoutId !== undefined) {
      clearTimeout(pollTimeoutId);
      pollTimeoutId = undefined;
    }
  } catch (error) {
    console.error("An error occurred during clearPollTimeout:", error);
  }
};
const makeChangement = async (design): Promise<void> => {
  console.log("salut making the change", design);
  editVariables(design.variables);
  findImgAndReplace(design.images);
  settingNonVisibleEmptyText();

  const response = await fetch(
    `${BACKENDURL}/figma/${datas.FigmaFileKey}/changeApplied`,
    {
      method: "POST",
    }
  ).then((res) => {
    //checkIfChanged();
    return;
  });
};

//Function to edit variables. Working, but editing all vairable at once
const editVariables = (variables: Array<string>): void => {
  const localCollections = figma.variables.getLocalVariableCollections();

  console.log("gettings variables", variables);
  //  console.log(localCollections[0].modes[0].modeId);
  //figma.closePlugin();

  const localStringVariables = figma.variables.getLocalVariables("STRING"); // filters local variables by the 'STRING' type

  localStringVariables.map((e, index) => {
    // console.log("looping through var", e);
    //console.log("the Name", e.name);

    variables.forEach((item) => {
      if (item.name === e.name) {
        // console.log("Bonjour la value dans item ", item.valuesByMode);
        //console.log("Value dans e", e.valuesByMode);

        const newValue: VariableValue = item.valuesByMode;
        e.setValueForMode(localCollections[0].modes[0].modeId, newValue);
      }
    });
  });
};

// Function to edit a specific img
const findImgAndReplace = async (images) => {
  console.log("📸salut l'image 📸");

  for (const image of images) {
    if (image.hasChanged) {
      console.log(image.name, "has changed");
      console.log("Then I'll do something", image);

      const nodes = figma.currentPage.findAll((n) => n.name === image.name);
      console.log("I found the node", nodes);

      try {
        const img = await figma.createImageAsync(image.url);
        nodes.forEach((node) => {
          node.fills = [
            {
              type: "IMAGE",
              imageHash: img.hash,
              scaleMode: "FIT",
            },
          ];
        });
      } catch (error) {
        console.error("Error creating image:", error);
        if (error === "Image is too large") {
          console.log("image too large");
        }
      }
    } else {
      console.log(image.name, " has not changed");
    }
  }
};

//Starting the plugin

const createUI = async (): Promise<void> => {
  console.log("Creating the UI and fetching client");
  const response = await fetch(`${BACKENDURL}/client`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((clientArray) => {
      let clientList: Array<Client> = [];
      clientArray.map((client: any) => {
        // console.log(client);
        clientList.push(client.username);
      });
      //console.log("liste des clients", clientArray);
      figma.showUI(__html__, { width: 400, height: 400, title: "Framework" });
      figma.ui.postMessage(clientList);
      figma.ui.onmessage = (msg) => {
        if (
          msg.type === "create-framework" ||
          msg.type === "update-framework"
        ) {
          const usedBy = clientArray.find(
            (user) => user.username === msg.allValues[0]
          );
          retrieveAllDatas();
          console.log("here is the used by ", usedBy);
          createOrUpdateDesign(usedBy, msg.type);
        } else if (msg.type === "test") {
          console.log("bouton test");
          figma.ui.postMessage("Bonjour le message");
        }
      };
    });
};

const createOrUpdateDesign = async (usedBy, msgType) => {
  datas.usedBy = usedBy;

  //  console.log("bonjour les datas", datas);
  try {
    let response;
    if (msgType === "create-framework") {
      response = await fetch(`${BACKENDURL}/figma/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(datas),
      });
      figma.ui.postMessage("All good");
    } else if (msgType === "update-framework") {
      response = await fetch(`${BACKENDURL}/figma/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(datas),
      });
      figma.ui.postMessage("All good");
    }

    if (!response.ok) {
      figma.ui.postMessage(
        `Failed to create or update. Status code: ${response.status}`
      );
      throw new Error(
        `Failed to create of update. Status code: ${response.status}`
      );
    }
  } catch (error) {
    console.log(error);
  }
};

function settingNonVisibleEmptyText() {
  console.log("Hello le setting visible");

  const texts = figma.currentPage.findAll((text) => text.type === "TEXT");
  texts.map((text) => {
    if (text.characters === " " || text.characters === "") {
      console.log("Be careful, is empty, should make it unvisible");
      text.visible = false;
    } else {
      text.visible = true;
    }
  });
  console.log(texts);
}

const retrieveAllDatas = async (): Promise<void> => {
  console.log("Retrieving datas");

  datas = {
    FigmaName: figma.root.name,
    FigmaFileKey: figma.fileKey,
    FigmaId: figma.currentPage.id,
    sections: [],
    images: [],
    variables: [],
    usedBy: {},
  };

  const sections = figma.currentPage.findAll(
    (section) => section.type === "SECTION"
  );
  // console.log("bonjour les sections", sections, typeof sections);

  sections.forEach((section) => {
    const sectionData = {
      type: "SECTION",
      name: section.name,
      id: section.id,
      frames: [], // Initialize an empty array to store frames within the section
    };

    const frames = section.children;
    frames.forEach((frame) => {
      const frameData = {
        type: "FRAME",
        sectionName: section.name,
        frameName: frame.name,
        frameId: frame.id,
      };
      sectionData.frames.push(frameData); // Push frame data into the section's frames array
    });

    datas.sections.push(sectionData); // Push section data into the datas array
  });

  const images = figma.currentPage.findAll((image) =>
    image.name.includes("EditImg")
  );

  //console.log("voilà les images que jai trouvé", images);
  images.forEach((image) => {
    const imageData = {
      type: "IMAGE",
      name: image.name,
      id: image.id,
    };
    datas.images.push(imageData); // Push image data into the datas array
  });

  const textVariables = figma.variables.getLocalVariables("STRING");
  textVariables.forEach((text) => {
    // console.log(
    //   "bonjour un text",
    //   text.valuesByMode,
    //   "but also",
    //   Object.values(text.valuesByMode)[0]
    // );
    const textData = {
      type: "TEXT",
      name: text.name,
      valuesByMode: Object.values(text.valuesByMode)[0],
      id: text.id,
    };
    datas.variables.push(textData); // Push text data into the datas array
  });

  const floatVariables = figma.variables.getLocalVariables("FLOAT");
  floatVariables.forEach((float) => {
    //console.log("salut la value", float.valuesByMode["250:0"]);
    const floatData = {
      type: "FLOAT",
      name: float.name,
      valuesByMode: Object.values(float.valuesByMode)[0],
      id: float.id,
    };
    datas.variables.push(floatData); // Push float data into the datas array
  });

  const colorVariables = figma.variables.getLocalVariables("COLOR");
  colorVariables.forEach((color) => {
    const colorData = {
      type: "COLOR",
      name: color.name,
      valuesByMode: Object.values(color.valuesByMode)[0],
      id: color.id,
    };
    datas.variables.push(colorData); // Push color data into the datas array
  });

  const boolVariables = figma.variables.getLocalVariables("BOOLEAN");
  boolVariables.forEach((bool) => {
    const boolData = {
      type: "BOOLEAN",
      name: bool.name,
      valuesByMode: Object.values(bool.valuesByMode)[0],
      id: bool.id,
    };
    datas.variables.push(boolData); // Push bool data into the datas array
  });

  // Now, datas array contains all the collected data
  // console.log("All data:", datas);
};

console.log("🛠️ Starting the plugin 🛠️");
// Call the function to retrieve and store data
retrieveAllDatas();
createUI();
checkIfChanged();
