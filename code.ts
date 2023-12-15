const BACKENDURL = "http://localhost:3000/api/";
//const BACKENDURL = "https://framework-backend.fly.dev/api";
//The first function called

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
      // console.log("No change...", design);
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
      let clientList: Array<Client> = [];
      clientArray.map((client: any) => clientList.push(client.username));
      const datas = [
        figma.root.name,
        figma.fileKey,
        figma.currentPage.id,
        figma.currentPage.children,
        figma.currentPage.findAll((frame) => frame.type === "FRAME"),
        figma.currentPage.findAll((section) => section.type === "SECTION"),
        figma.variables.getLocalVariables("STRING").length,
        figma.variables.getLocalVariables("COLOR"),
        figma.variables.getLocalVariables("BOOLEAN"),
        figma.variables.getLocalVariables("FLOAT"),
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

const retrieveAllDatas = async (): Promise<void> => {
  console.log("Retrieving datas");
  let datas = []; // Initialize an empty array to store data
  datas.push({ FigmaName: figma.root.name });
  datas.push({ FigmaFileKey: figma.fileKey });
  datas.push({ FigmaId: figma.currentPage.id });

  const sections = figma.currentPage.findAll(
    (section) => section.type === "SECTION"
  );
  console.log("bonjour les sections", sections, typeof sections);

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

    datas.push(sectionData); // Push section data into the datas array
  });

  const images = figma.currentPage.findAll((image) =>
    image.name.includes("EditImg")
  );
  images.forEach((image) => {
    const imageData = {
      type: "IMAGE",
      name: image.name,
      id: image.id,
    };
    datas.push(imageData); // Push image data into the datas array
  });

  const textVariables = figma.variables.getLocalVariables("STRING");
  textVariables.forEach((text) => {
    const textData = {
      type: "TEXT",
      name: text.name,
      valuesByMode: text.valuesByMode,
      id: text.id,
    };
    datas.push(textData); // Push text data into the datas array
  });

  const floatVariables = figma.variables.getLocalVariables("FLOAT");
  floatVariables.forEach((float) => {
    const floatData = {
      type: "FLOAT",
      name: float.name,
      valuesByMode: float.valuesByMode,
      id: float.id,
    };
    datas.push(floatData); // Push float data into the datas array
  });

  const colorVariables = figma.variables.getLocalVariables("COLOR");
  colorVariables.forEach((color) => {
    const colorData = {
      type: "COLOR",
      name: color.name,
      valuesByMode: color.valuesByMode,
      id: color.id,
    };
    datas.push(colorData); // Push color data into the datas array
  });

  const boolVariables = figma.variables.getLocalVariables("BOOLEAN");
  boolVariables.forEach((bool) => {
    const boolData = {
      type: "BOOLEAN",
      name: bool.name,
      valuesByMode: bool.valuesByMode,
      id: bool.id,
    };
    datas.push(boolData); // Push bool data into the datas array
  });

  // Now, datas array contains all the collected data
  console.log("All data:", datas);

  try {
    console.log("Bonjour jenvoi un fetch");
    const response = await fetch(`${BACKENDURL}/figma/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify(datas),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data. Status code: ${response.status}`);
    }
  } catch (error) {
    console.log(error);
  }
};

// Call the function to retrieve and store data
retrieveAllDatas();

console.log("🛠️ Starting the plugin 🛠️");

//makeAPIcall();
//retrieveClient();
