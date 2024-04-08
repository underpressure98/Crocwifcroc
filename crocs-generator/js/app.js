let canvas = new fabric.Canvas("imageCanvas", {
  width: document.getElementById("canvasContainer").offsetWidth,
  height: document.getElementById("canvasContainer").offsetHeight,
});

document.getElementById("imageLoader").addEventListener("change", function (e) {
  const reader = new FileReader();
  reader.onload = function (event) {
    fabric.Image.fromURL(event.target.result, function (oImg) {
      // Scale the image to fit inside the canvasContainer
      var scale = Math.min(
        (canvas.getWidth() / oImg.width) * 1,
        (canvas.getHeight() / oImg.height) * 1
      );
      oImg.scale(scale);
      oImg.set({
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: "center",
        originY: "center",
        selectable: false, // Prevent image from being selectable
        evented: false, // Prevent image from receiving events (like mouse click)
        hasControls: false, // Hide control borders and corners
      });
      canvas.centerObject(oImg); // Center the image in the canvas
      canvas.add(oImg);
      canvas.renderAll();
    });
  };
  reader.readAsDataURL(e.target.files[0]);
});

document.querySelectorAll(".sticker").forEach((img) => {
  img.addEventListener("click", function () {
    fabric.Image.fromURL(img.src, function (sticker) {
      sticker.scaleToWidth(200); // Initial sticker size
      sticker.set({
        // Enabling rotation and other controls
        transparentCorners: false,
        cornerColor: "yellow",
        cornerSize: 16,
        rotatingPointOffset: 20,
        lockScalingFlip: true,
        hasBorders: true,
        hasControls: true,
        hasRotatingPoint: true,
      });
      canvas.add(sticker);
      canvas.setActiveObject(sticker);
    });
  });
});

canvas.on("object:rotating", function (options) {
  options.target.snapAngle = 5; // Snaps the rotation to 15-degree increments
});

document.getElementById("deleteBtn").addEventListener("click", function () {
  var activeObject = canvas.getActiveObject();
  if (activeObject) {
    canvas.remove(activeObject);
    canvas.requestRenderAll();
  }
});

document.getElementById("resetBtn").addEventListener("click", function () {
  canvas.clear();
});

canvas.on("selection:created", function () {
  document.getElementById("deleteBtn").style.display = "block";
});

canvas.on("selection:cleared", function () {
  document.getElementById("deleteBtn").style.display = "none";
});

canvas.on("selection:updated", function () {
  document.getElementById("deleteBtn").style.display = "block";
});

document.getElementById("addStickerBtn").addEventListener("click", function () {
  openStickerPopup(); // Function that opens the sticker selection pop-up
});

document.getElementById("saveBtn").addEventListener("click", function () {
  const dataURL = canvas.toDataURL({
    format: "png",
    quality: 1,
  });

  // Create a temporary link element
  const link = document.createElement("a");
  link.download = "canvas-image.png"; // Name of the downloaded file
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Get the modal
var modal = document.getElementById("stickerPopup");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
};

// Function to open the modal
function openStickerPopup() {
  modal.style.display = "block";
}

// Close the modal if the user clicks outside of it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// Add event listeners to stickers (similar to previous implementation)
document.querySelectorAll(".sticker").forEach((img) => {
  img.addEventListener("click", function () {
    // Existing code to add sticker to canvas
    modal.style.display = "none"; // Close the modal after selecting a sticker
  });
});
let lastDist = null;

canvas.on("mouse:down", function (opt) {
  var evt = opt.e;
  if (evt.altKey === true) {
    this.isDragging = true;
    this.selection = false;
    this.lastPosX = evt.clientX;
    this.lastPosY = evt.clientY;
  }
});

canvas.on("mouse:move", function (opt) {
  if (this.isDragging) {
    var e = opt.e;
    var vpt = this.viewportTransform;
    vpt[4] += e.clientX - this.lastPosX;
    vpt[5] += e.clientY - this.lastPosY;
    this.requestRenderAll();
    this.lastPosX = e.clientX;
    this.lastPosY = e.clientY;
  }
});

canvas.on("mouse:up", function (opt) {
  this.setViewportTransform(this.viewportTransform);
  this.isDragging = false;
  this.selection = true;
});

function scaleObject(scaleMultiplier) {
  let obj = canvas.getActiveObject();
  if (obj && obj.type === "image") {
    // Ensure it's a sticker (image)
    let currentScale = obj.scaleX;
    let newScale = currentScale * scaleMultiplier;
    obj.scale(newScale).setCoords();
    canvas.renderAll();
  }
}

let canvasContainer = document.getElementById("canvasContainer");
let canvasElement = document.getElementById("imageCanvas");

// Prevent the default behavior for dragover events
canvasContainer.addEventListener("dragover", function (e) {
  e.preventDefault();
});

// Set up the drop event listener
canvasContainer.addEventListener("drop", function (e) {
  e.preventDefault();
  handleDrop(e);
});

canvasContainer.addEventListener("dragover", function (e) {
  e.preventDefault(); // This is necessary to allow for the drop event to fire.
  canvasContainer.style.border = "2px dashed red"; // Optional: Visual feedback
});

canvasContainer.addEventListener("dragleave", function (e) {
  canvasContainer.style.border = ""; // Optional: Revert visual feedback
});

function handleDrop(e) {
  e.preventDefault();
  let dt = e.dataTransfer;
  let files = dt.files;

  Array.from(files).forEach((file) => {
    if (file.type.match("image.*")) {
      let reader = new FileReader();

      reader.onload = function (event) {
        fabric.Image.fromURL(event.target.result, function (oImg) {
          // Calculate the scale to fit the image to the canvas width while maintaining aspect ratio
          var scale = canvas.getWidth() / oImg.width;
          var scaledHeight = oImg.height * scale;

          // If the scaled height is less than the canvas height, scale based on the canvas height instead
          if (scaledHeight < canvas.getHeight()) {
            scale = canvas.getHeight() / oImg.height;
          }

          // Set the image as canvas background
          canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
            scaleX: scale,
            scaleY: scale,
            originX: "center",
            originY: "center",
            top: canvas.getHeight() / 2,
            left: canvas.getWidth() / 2,
            crossOrigin: "anonymous", // If you are dealing with CORS
          });

          canvas.renderAll(); // Render the canvas
        });
      };

      reader.readAsDataURL(file);
    }
  });
}

canvasContainer.addEventListener("drop", function (e) {
  e.preventDefault();
  canvasContainer.style.border = ""; // Optional: Revert visual feedback
  handleDrop(e);
});
