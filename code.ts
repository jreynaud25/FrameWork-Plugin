const BACKENDURL = "http://localhost:3000/api/";
//const BACKENDURL = "https://framework-backend.fly.dev/api";
//The first function called
//Bonjoru un commentaire

//Function to make API call to check if there is any change
const makeAPIcall = async (): Promise<void> => {
  try {
    const response = await fetch(`${BACKENDURL}/figma/${figma.fileKey}/change`);

    if (!response.ok) {
      throw new Error(`Failed to fetch data. Status code: ${response.status}`);
    }

    const design = await response.json();

    if (design.asChanged) {
      console.log("Change detected !", design);
      await makeChangement(design);
    } else {
      console.log("No change...", design);
    }
  } catch (error) {
    console.error("An error occurred while making the API call:", error);
  } finally {
    // Ensure that makeAPIcall is always called, even if an error occurs
    setTimeout(makeAPIcall, 1000);
  }
};

const makeChangement = async (design): Promise<void> => {
  console.log("salut making the change", design);
  editVariables(design.textValues);
  findImgAndReplace(design.picture);

  const response = await fetch(
    `${BACKENDURL}/figma/${figma.fileKey}/changeApplied`,
    {
      method: "POST",
    }
  ).then((res) => {
    makeAPIcall();
  });
};

//Function to edit variables. Working, but editing all vairable at once
const editVariables = (textValues: Array<string>): void => {
  const localCollections = figma.variables.getLocalVariableCollections();

  console.log(localCollections);
  console.log(localCollections[0].modes[0].modeId);
  //figma.closePlugin();

  const localVariables = figma.variables.getLocalVariables("STRING"); // filters local variables by the 'STRING' type

  console.log(
    "local variables",
    localVariables,
    "and the text Values",
    textValues
  );

  localVariables.map((e, index) => {
    console.log("salut index", index);
    console.log("Name", e.name, "and the value", "Value", e.valuesByMode);
    const newValue: VariableValue = textValues[index];
    e.setValueForMode(localCollections[0].modes[0].modeId, newValue);
  });
};

// Function to edit a specific img
const findImgAndReplace = (imgURL): void => {
  console.log("📸salut l'image 📸");
  const node = figma.currentPage.findOne((n) => n.name === "img3");

  figma.createImageAsync(imgURL).then(async (image: Image) => {
    // Create a rectangle that's the same dimensions as the image.
    // const node = figma.createRectangle();

    // const { width, height } = await image.getSizeAsync();
    // node.resize(width, height);

    //  Render the image by filling the rectangle.
    node.fills = [
      {
        type: "IMAGE",
        imageHash: image.hash,
        scaleMode: "FILL",
      },
    ];
  });
};

//Starting the plugin

const retrieveClient = async (): Promise<void> => {
  console.log("salut making the change");

  const response = await fetch(`${BACKENDURL}/client`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((clientArray) => {
      let clientList: Array<T> = [];
      clientArray.map((client) => clientList.push(client.username));
      const datas = [
        figma.root.name,
        figma.fileKey,
        currentPage.id,
        currentPage.children,
        figma.variables.getLocalVariables("STRING").length,
        clientList,
      ];
      console.log("🛠️Enjoy !🛠️");

      figma.showUI(__html__, { width: 400, height: 600, title: "Framework" });
      figma.ui.postMessage(datas);
      figma.ui.onmessage = (msg) => {
        if (msg.type === "create-framework") {
          console.log("should create the framework using API");
        }
      };
    });
};

console.log("🛠️ Starting the plugin 🛠️");
const currentPage = figma.currentPage;

console.log(
  "Here are the information you have to provide to the Framework Front-end ",
  currentPage
);

console.log("Figma Id", figma.fileKey);
console.log("Figma Node Id", currentPage.id);
console.log("Figma Image Node ", currentPage.children);
console.log(
  "Number of variables",
  figma.variables.getLocalVariables("STRING").length
);

makeAPIcall();
retrieveClient();

//figma.currentPage.selection = nodes;
//figma.viewport.scrollAndZoomIntoView(nodes);
