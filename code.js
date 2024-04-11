"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
let pollTimeoutId;
//Function to make API call to check if there is any change
const POLL_INTERVAL = 1000; // Configurable polling interval
let changeDesignStatus;
const fetchDesignChange = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        changeDesignStatus = yield fetch(`${BACKENDURL}/figma/${datas.FigmaFileKey}/change`);
        if (!changeDesignStatus.ok) {
            // Check for error status codes (e.g., 404, 500)
            console.error("Error response from server:", changeDesignStatus.status, changeDesignStatus.statusText);
            throw new Error(`Failed to fetch design change. Server returned status ${changeDesignStatus.status}`);
        }
        const responseData = yield changeDesignStatus.json();
        return responseData;
    }
    catch (error) {
        console.error("An error occurred during fetchDesignChange:", error.message || error);
        throw new Error("Failed to fetch design change.");
    }
});
const processDesignChange = (design) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (design.hasChanged) {
            console.log("Change detected!", design);
            yield makeChangement(design);
        }
    }
    catch (error) {
        console.error("An error occurred during processDesignChange:", error);
        yield fetch(`${BACKENDURL}/figma/error`);
        throw new Error("Failed to process design change.");
    }
});
const checkIfChanged = () => __awaiter(void 0, void 0, void 0, function* () {
    //console.log("Checking if design has changed");
    try {
        const design = yield fetchDesignChange();
        yield processDesignChange(design);
    }
    catch (error) {
        yield fetch(`${BACKENDURL}/figma/error`);
        console.error("An error occurred while making the API call:", error);
    }
    finally {
        if (datas.FigmaFileKey) {
            pollTimeoutId = setTimeout(checkIfChanged, POLL_INTERVAL);
        }
    }
});
const clearPollTimeout = () => {
    try {
        if (pollTimeoutId !== undefined) {
            clearTimeout(pollTimeoutId);
            pollTimeoutId = undefined;
        }
    }
    catch (error) {
        console.error("An error occurred during clearPollTimeout:", error);
    }
};
const makeChangement = (design) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("salut making the change", design);
    editVariables(design.variables);
    findImgAndReplace(design.images);
    settingNonVisibleEmptyText();
    const response = yield fetch(`${BACKENDURL}/figma/${datas.FigmaFileKey}/changeApplied`, {
        method: "POST",
    }).then((res) => {
        //checkIfChanged();
        return;
    });
});
//Function to edit variables. Working, but editing all vairable at once
const editVariables = (variables) => {
    const localCollections = figma.variables.getLocalVariableCollections();
    console.log("gettings variables", variables);
    //  console.log(localCollections[0].modes[0].modeId);
    //figma.closePlugin();
    const localStringVariables = figma.variables.getLocalVariables("STRING"); // filters local variables by the 'STRING' type
    localStringVariables.map((e, index) => {
        console.log("looping through var", e);
        console.log("the Name", e.name);
        variables.forEach((item) => {
            if (item.name === e.name) {
                console.log("Bonjour la value dans item ", item.valuesByMode);
                console.log("Value dans e", e.valuesByMode);
                const newValue = item.valuesByMode;
                e.setValueForMode(localCollections[0].modes[0].modeId, newValue);
            }
        });
    });
};
// Function to edit a specific img
const findImgAndReplace = (images) => {
    console.log("📸salut l'image 📸");
    images.map((image) => {
        console.log("Je loop sur les images", image);
        if (image.hasChanged) {
            const nodes = figma.currentPage.findAll((n) => n.name === image.name);
            figma.createImageAsync(image.url).then((image) => __awaiter(void 0, void 0, void 0, function* () {
                nodes.map((node) => {
                    node.fills = [
                        {
                            type: "IMAGE",
                            imageHash: image.hash,
                            scaleMode: "FILL",
                        },
                    ];
                });
            }));
        }
        else {
            console.log(image.name, " as not change");
        }
    });
};
//Starting the plugin
const createUI = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Creating the UI and fetching client");
    const response = yield fetch(`${BACKENDURL}/client`, {
        method: "GET",
    })
        .then((response) => response.json())
        .then((clientArray) => {
        let clientList = [];
        clientArray.map((client) => {
            // console.log(client);
            clientList.push(client.username);
        });
        //console.log("liste des clients", clientArray);
        figma.showUI(__html__, { width: 400, height: 400, title: "Framework" });
        figma.ui.postMessage(clientList);
        figma.ui.onmessage = (msg) => {
            if (msg.type === "create-framework" ||
                msg.type === "update-framework") {
                const usedBy = clientArray.find((user) => user.username === msg.allValues[0]);
                retrieveAllDatas();
                console.log("here is the used by ", usedBy);
                createOrUpdateDesign(usedBy, msg.type);
            }
            else if (msg.type === "test") {
                console.log("bouton test");
                figma.ui.postMessage("Bonjour le message");
            }
        };
    });
});
const createOrUpdateDesign = (usedBy, msgType) => __awaiter(void 0, void 0, void 0, function* () {
    datas.usedBy = usedBy;
    //  console.log("bonjour les datas", datas);
    try {
        let response;
        if (msgType === "create-framework") {
            response = yield fetch(`${BACKENDURL}/figma/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: JSON.stringify(datas),
            });
            figma.ui.postMessage("All good");
        }
        else if (msgType === "update-framework") {
            response = yield fetch(`${BACKENDURL}/figma/update`, {
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
            figma.ui.postMessage(`Failed to create or update. Status code: ${response.status}`);
            throw new Error(`Failed to create of update. Status code: ${response.status}`);
        }
    }
    catch (error) {
        console.log(error);
    }
});
function settingNonVisibleEmptyText() {
    console.log("Hello le setting visible");
    const texts = figma.currentPage.findAll((text) => text.type === "TEXT");
    texts.map((text) => {
        if (text.characters === " " || text.characters === "") {
            console.log("Be careful, is empty, should make it unvisible");
            text.visible = false;
        }
        else {
            text.visible = true;
        }
    });
    console.log(texts);
}
const retrieveAllDatas = () => __awaiter(void 0, void 0, void 0, function* () {
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
    const sections = figma.currentPage.findAll((section) => section.type === "SECTION");
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
    const images = figma.currentPage.findAll((image) => image.name.includes("EditImg"));
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
        console.log("bonjour un text", text.valuesByMode, "but also", Object.values(text.valuesByMode)[0]);
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
});
console.log("🛠️ Starting the plugin 🛠️");
// Call the function to retrieve and store data
retrieveAllDatas();
createUI();
checkIfChanged();
