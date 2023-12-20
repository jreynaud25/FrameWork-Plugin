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
const BACKENDURL = "http://localhost:3000/api/";
//const BACKENDURL = "https://framework-backend.fly.dev/api";
//The first function called
let datas = {
    FigmaName: figma.root.name,
    FigmaFileKey: figma.fileKey,
    FigmaId: figma.currentPage.id,
    sections: [],
    images: [],
    variables: [],
};
//Function to make API call to check if there is any change
const makeAPIcall = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch(`${BACKENDURL}/figma/${figma.fileKey}/change`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status code: ${response.status}`);
        }
        const design = yield response.json();
        if (design.asChanged) {
            //if (true) {
            console.log("Change detected !", design);
            yield makeChangement(design);
        }
        else {
            console.log("No change...", design);
        }
    }
    catch (error) {
        console.error("An error occurred while making the API call:", error);
    }
    finally {
        // Ensure that makeAPIcall is always called, even if an error occurs
        setTimeout(makeAPIcall, 1000);
    }
});
const makeChangement = (design) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("salut making the change", design);
    //editVariables(design.variables);
    findImgAndReplace(design.images);
    const response = yield fetch(`${BACKENDURL}/figma/${figma.fileKey}/changeApplied`, {
        method: "POST",
    }).then((res) => {
        makeAPIcall();
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
        const newValue = textValues[index];
        e.setValueForMode(localCollections[0].modes[0].modeId, newValue);
    });
};
// Function to edit a specific img
const findImgAndReplace = (images) => {
    console.log("📸salut l'image 📸");
    console.log("les images", images);
    images.map((image) => {
        console.log("Je loop sur les images", image);
        const nodes = figma.currentPage.findAll((n) => n.name === image.name);
        console.log("J'ai trouvé les nodes des images ", nodes);
        figma.createImageAsync(image.url).then((image) => __awaiter(void 0, void 0, void 0, function* () {
            console.log("Limage", image);
            console.log("Jai toujours les nodes", nodes);
            nodes.map((node) => {
                console.log("Node par node", node);
                node.fills = [
                    {
                        type: "IMAGE",
                        imageHash: image.hash,
                        scaleMode: "FILL",
                    },
                ];
            });
        }));
    });
};
//Starting the plugin
const retrieveClient = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Finding the clients");
    const response = yield fetch(`${BACKENDURL}/client`, {
        method: "GET",
    })
        .then((response) => response.json())
        .then((clientArray) => {
        let clientList = [];
        clientArray.map((client) => clientList.push(client.username));
        console.log("🛠️Enjoy !🛠️");
        figma.showUI(__html__, { width: 400, height: 600, title: "Framework" });
        figma.ui.postMessage(datas);
        figma.ui.onmessage = (msg) => {
            if (msg.type === "create-framework") {
                console.log("should create the framework using API");
                createDesign();
            }
        };
    });
});
const createDesign = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Bonjour jenvoi un fetch");
        const response = yield fetch(`${BACKENDURL}/figma/create`, {
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
    }
    catch (error) {
        console.log(error);
    }
});
function settingNonVisibleEmptyText() {
    console.log("Hello le setting visible");
    const texts = figma.currentPage.findAll((text) => text.type === "TEXT");
    texts.map((text) => {
        // console.log("Displaying informations : ", text);
        // console.log(
        //   "Name :",
        //   text.name,
        //   "characteres : ",
        //   text.characters,
        //   " visible ",
        //   text.visible,
        //   " id ",
        //   text.id,
        //   "vairable ",
        //   text.boundVariables
        // );
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
        const textData = {
            type: "TEXT",
            name: text.name,
            valuesByMode: text.valuesByMode,
            id: text.id,
        };
        datas.variables.push(textData); // Push text data into the datas array
    });
    const floatVariables = figma.variables.getLocalVariables("FLOAT");
    floatVariables.forEach((float) => {
        console.log("salut la value", float.valuesByMode);
        const floatData = {
            type: "FLOAT",
            name: float.name,
            valuesByMode: float.valuesByMode,
            id: float.id,
        };
        datas.variables.push(floatData); // Push float data into the datas array
    });
    const colorVariables = figma.variables.getLocalVariables("COLOR");
    colorVariables.forEach((color) => {
        const colorData = {
            type: "COLOR",
            name: color.name,
            valuesByMode: color.valuesByMode,
            id: color.id,
        };
        datas.variables.push(colorData); // Push color data into the datas array
    });
    const boolVariables = figma.variables.getLocalVariables("BOOLEAN");
    boolVariables.forEach((bool) => {
        const boolData = {
            type: "BOOLEAN",
            name: bool.name,
            valuesByMode: bool.valuesByMode,
            id: bool.id,
        };
        datas.variables.push(boolData); // Push bool data into the datas array
    });
    // Now, datas array contains all the collected data
    console.log("All data:", datas);
});
//settingNonVisibleEmptyText();
console.log("🛠️ Starting the plugin 🛠️");
// Call the function to retrieve and store data
retrieveAllDatas();
makeAPIcall();
retrieveClient();
