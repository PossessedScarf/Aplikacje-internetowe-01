window.onload = function () {
    let map = L.map('map').setView([53.430127, 14.564802], 18);
    L.tileLayer.provider('Esri.WorldImagery').addTo(map);

    let rasterMap = document.getElementById("rasterMap");
    let rasterContext = rasterMap.getContext("2d");

    const imgWidth = rasterMap.width;
    const imgHeight = rasterMap.height;

    document.getElementById("saveButton").addEventListener("click", function() {
        leafletImage(map, function (err, canvas) {
            rasterContext.drawImage(canvas, 0, 0, rasterMap.width, rasterMap.height);

            document.getElementById("puzzleButton").disabled = false
        });
    });

    let puzzleAmount = 2;
    let puzzleAmountSelector = document.getElementById("size");

    puzzleAmountSelector.addEventListener("change", function (event) {
        puzzleAmount = parseInt(event.target.value);
    })

    document.getElementById("getLocation").addEventListener("click", function(event) {
        if (! navigator.geolocation) {
            console.log("No geolocation.");
        }

        navigator.geolocation.getCurrentPosition(position => {
            console.log(position);
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;

            map.setView([lat, lon]);
            let marker = L.marker([lat, lon]).addTo(map);
            marker.bindPopup("I am here!").openPopup();
        }, positionError => {
            console.error(positionError);
        });
    });

    document.getElementById("puzzleButton").addEventListener("click", function (event){
        let puzzleContainer = document.getElementById("puzzleContainer");
        let targetContainer = document.getElementById("targetContainer");
        let targetDropOff = document.getElementById("targetDropoff");
        let puzzle = document.getElementById("canvasX");
        let target = document.getElementById("targetX");
        layoutSquareish(puzzleAmount);

        if(targetContainer.childElementCount <=puzzleAmount) {
            for (let t = 0; t < puzzleAmount; t++) {
                const node = target.cloneNode(true);
                node.hidden = false;
                node.id = String("target" + t);
                targetContainer.appendChild(node);
            }
            getTargets();

            for (let p = 0; p < puzzleAmount; p++) {
                const node = puzzle.cloneNode(true);
                node.hidden = false;
                node.id = String("puzzle" + p);
                node.width = (getPuzzleSize(puzzleAmount)[0]);
                node.height = (getPuzzleSize(puzzleAmount)[1]);
                puzzleContainer.appendChild(node);

                if(p > 0 && p % Math.floor(Math.random() * 3)){
                    let targetNode = document.getElementById("puzzle" + (p-1));
                    node.after(targetNode);
                }
            }
            getContext(puzzleAmount);
            getDragStart();
            targetContainer.hidden = false;
            rasterMap.hidden = true;
            targetDropOff.hidden = false;
        }


    })
    function showNotification() {
        if (Notification.permission === "granted") {
            let notification = new Notification("Puzzle zrobione!");
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    let notification = new Notification("Puzzle zrobione!");
                }
            });
        }
    }

    function getDragStart() {
        let items = document.querySelectorAll('.item');
        for (let item of items) {
            item.addEventListener("dragstart", function (event) {
                this.style.border = "5px dashed #D8D8FF";
                event.dataTransfer.setData("text", this.id);
            });

            item.addEventListener("dragend", function (event) {
                this.style.borderWidth = "0";
            });
        }
    }
    function getTargets() {
        let targets = document.querySelectorAll(".drag-target");
        for (let target of targets) {
            target.addEventListener("dragenter", function (event) {
                this.style.border = "0px solid black";
            });
            target.addEventListener("dragleave", function (event) {
                this.style.border = "1px solid black";
            });
            target.addEventListener("dragover", function (event) {
                event.preventDefault();
            });
            target.addEventListener("drop", function (event) {
                let myElement = document.querySelector("#" + event.dataTransfer.getData('text'));
                if (this.childElementCount === 0) {
                    this.appendChild(myElement)
                }
                else if (this.id === "targetDropoff") {
                    this.appendChild(myElement);
                }
                this.style.border = "0px solid black";
                checkCompletion();
            }, false);
        }
    }

    function isCorrect(i) {
        const tile = document.getElementById("puzzle" + i);
        const target = document.getElementById("target" + i);
        return tile.parentElement === target;
    }

    function checkCompletion() {
        let correct = 0;

        for (let i = 0; i < puzzleAmount; i++) {
            if (isCorrect(i)) {
                correct++;
                //console.log(correct)
                //console.log(puzzleAmount + " puzzle")
            }
        }

        if (correct === puzzleAmount) {
            //console.log("puzzle zrobione!")

            const targetContainer = document.getElementById("targetContainer");

            if (!document.getElementById("completionOverlay")) {
                const overlay = document.createElement("div");
                overlay.id = "completionOverlay";
                overlay.textContent = "Puzzle Completed!";
                overlay.classList.add("completionOverlay");

                targetContainer.appendChild(overlay);

                requestAnimationFrame(() => {
                    overlay.style.opacity = "1";
                });
            }
            showNotification();
        }
    }

    function getContext(puzzleAmount) {
        const { cols, rows } = getGrid(puzzleAmount);
        const [pieceW, pieceH] = getPuzzleSize(puzzleAmount);

        let puzzleID = 0;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tile = document.getElementById("puzzle" + puzzleID);
                if (!tile) return;
                puzzleID++;

                tile.width = pieceW;
                tile.height = pieceH;

                const tileContext = tile.getContext("2d");
                tileContext.clearRect(0, 0, tile.width, tile.height);

                tileContext.drawImage(rasterMap, col * pieceW, row * pieceH,
                    pieceW, pieceH, 0, 0, pieceW, pieceH);
            }
        }
    }

    function layoutSquareish(pieces) {
        const { cols, rows } = getGrid(pieces);
        const c = document.getElementById("targetContainer");
        c.style.display = "grid";
        c.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        c.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    }

    function getGrid(pieces) {
        const n = Math.log2(pieces);

        const aspect = imgWidth / imgHeight;
        let best = { cols: pieces, rows: 1, score: Infinity };

        // rows = 2^r, cols = 2^(n-r)
        for (let rPow = 0; rPow <= n; rPow++) {
            const rows = 2 ** rPow;
            const cols = pieces / rows;
            const ratio = cols / rows;
            const score = Math.abs(ratio - aspect);

            if (score < best.score) {
                best = { cols, rows, score };
            }
        }
        return { cols: best.cols, rows: best.rows };
    }

    function getPuzzleSize(pieces) {
        const { cols, rows } = getGrid(pieces);
        return [imgWidth / cols, imgHeight / rows];
    }
};

