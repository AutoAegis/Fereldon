        function expandBox(element) {
            element.classList.add("expanded");
            document.getElementById("overlay").style.display = "block";
        }

        function closeBox() {
            let expanded = document.querySelector(".expanded");
            if (expanded) {
                expanded.classList.remove("expanded");
            }
            document.getElementById("overlay").style.display = "none";
        }