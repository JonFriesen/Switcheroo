

(function(window){
    Switcheroo = function(params) {
        this.optionData = params.data;
        this.isOpen = true;
        this.params = {
            data: [],
            keyBindings: {
                open: ['Control','Shift','F'],
                close: ['Escape']
            },
            text: {
                closeButton: 'Close',
                searchField: 'Start Typing...'
            },
            showCategories: true,
            prioritizeCategoricalSort: true,
            closeOnSelect: true
        };

        function setUserParams(defaultParams, userParams) {
              for (var params in userParams) {
                  if (userParams[params].constructor == Object) {
                      if (defaultParams[params]) {
                          setUserParams(defaultParams[params], userParams[params]);
                          continue;
                      }
                  }
                  defaultParams[params] = userParams[params];
              }
            };

        setUserParams(this.params, params);

        // Switcheroo Container
        var switcherooContainer = document.createElement('div');
        switcherooContainer.setAttribute('id', 'switcheroo');
        this.switcherooContainer = switcherooContainer;
        document.body.appendChild(this.switcherooContainer);

        // Escape button
        var removalButton = document.createElement('button');
        removalButton.setAttribute('id', 'switcheroo-removebutton');
        removalButton.innerHTML = 'Close';
        removalButton.onclick = function() { this.close(); }.bind(this);
        this.removalButton = removalButton;
        this.switcherooContainer.appendChild(removalButton);

        // Search Container
        var searchContainer = document.createElement('div');
        searchContainer.setAttribute('id', 'switcheroo-container');
        this.searchContainer = searchContainer;
        this.switcherooContainer.appendChild(searchContainer);

        // Search Field
        var searchField = document.createElement('input');
        searchField.setAttribute('type', 'text');
        searchField.setAttribute('id', 'switcheroo-field');
        searchField.setAttribute('placeholder', 'Start typing...');
        searchField.oninput = this.onFieldInput;
        this.searchField = searchField;
        this.searchContainer.appendChild(this.searchField);
        this.searchField.focus();

        // Search Results
        var searchResults = document.createElement('div');
        searchResults.setAttribute('id', 'switcheroo-results');
        this.searchResults = searchResults;
        this.searchContainer.appendChild(this.searchResults);
        this.registerKeyPresses();

        // Return Switcheroo object
        return this;
    };

    Switcheroo.prototype.open = function() {
        // Check if open
        if(!this.isOpen) {
            // Open
            this.switcherooContainer.style.display = 'unset';
            this.isOpen = true;
            this.searchField.focus();
        }
    };

    Switcheroo.prototype.close = function() {
        // Check if closed
        if(this.isOpen) {
            // Close
            this.switcherooContainer.style.display = 'none';
            this.isOpen = false;
            this.searchField.value = '';
            this.updateSearchResults();
        }
    };

    Switcheroo.prototype.isOpen = function() {
        return this.isOpen;
    };

    Switcheroo.prototype.onFieldInput = function(evt) {
        Switcheroo.updateSearchResults(evt.target.value);
    };

    Switcheroo.prototype.updateSearchResults = function(result) {
         Switcheroo.searchResults.innerHTML = '';
         Switcheroo.currentSearchResults = [];
         if (!result || result === '') { return; }
         this.optionData.forEach(function(option, index) {
            if (option.name.startsWith(result)) {
                var newOption = document.createElement('label');
                newOption.className += 'switcheroo-option';
                //if (index === 0) { newOption.className += ' switcheroo-selected'; }
                newOption.innerHTML = (this.params.showCategories ? option.category + ': ' : '') + option.name;
                Switcheroo.searchResults.appendChild(newOption);
                Switcheroo.currentSearchResults.push({
                            element: newOption,
                            option: option
                        });
            }
         }.bind(this));

    };

    Switcheroo.prototype.getData = function() {
        return this.optionData;
    };

    Switcheroo.prototype.registerKeyPresses = function() {
        // Map open/close combos
        if(!this.keyBindingMap) this.keyBindingMap = {};
        document.onkeydown = function(evt) {
            evt = evt || window.event;

            this.keyBindingMap[evt.key] = true;

            // Register open command
            if(!this.isOpen){
                var openCombo = this.params.keyBindings.open;
                var isSatisfied = openCombo.every(function(key) {
                    return (key in this.keyBindingMap && this.keyBindingMap[key] === true);
                }.bind(this));
                if(isSatisfied) {
                    this.open();
                }
            }
            // Register close command
            else {
               var closeCombo = this.params.keyBindings.close;
               var isSatisfied = closeCombo.every(function(key) {
                    return (key in this.keyBindingMap && this.keyBindingMap[key] === true);
               }.bind(this));
               if(isSatisfied) {
                    this.close();
               }
            }
        }.bind(this);
        document.onkeyup = function(evt) {
            evt = evt || window.event;
            if(evt.key in this.keyBindingMap) {
                this.keyBindingMap[evt.key] = false;
            }

            if(!this.isOpen) { return; }

            switch (evt.key) {
                // Enter for submit
                case 'Enter':
                    this.selectResult();
                    break;
                // Arrow keys for navigation
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.navigate(evt.key);
                    break;
                default:
                    this.autoFocusField(evt);
            }
        }.bind(this);
    }

    Switcheroo.prototype.autoFocusField = function(keyEvent) {
        var pressProducesCharacter = function(evt) {
            if (typeof evt.which == "undefined") {
                return true;
            } else if (typeof evt.which == "number" && evt.which > 0) {
                return !evt.ctrlKey
                        && !evt.metaKey
                        && !evt.altKey
                        && evt.which != 8
                        && evt.key.length === 1;
            }
            return false;
        };

        if(!pressProducesCharacter(keyEvent)) { return; }

        var activeElement = document.activeElement;

        if (this.searchField === activeElement) {
            return;
        }

        var currentValue = this.searchField.value;

        this.searchField.value += keyEvent.key;
        this.searchField.focus();
        this.updateSearchResults(this.searchField.value);
    }

    Switcheroo.prototype.navigate = function(direction) {
       // Get the list of elements
       var elementList = Switcheroo.currentSearchResults;
       // Get min/max/position
       var position = -1;
       var min = 0;
       var max = elementList.length - 1;
       // Check if any are highlighted
       elementList.forEach(function(option, index) {
            if(option.element.classList.contains('switcheroo-selected')) {
                position = index;
            }
       });
       // Execute direction change
       switch(direction) {
            case "ArrowDown":
                Switcheroo.setSelectedResult(position !== max ? position + 1 : 0);
                break;
            case "ArrowUp":
                Switcheroo.setSelectedResult(position > 0 ? position - 1 : elementList.length - 1);
                break;
       }
    }

    Switcheroo.prototype.setSelectedResult = function(position) {
        var elementList = Switcheroo.currentSearchResults;

        if(position < 0) {
            // Remove highlight
        } else if (position >= elementList.length) {
            // Handle end of list
        } else {
            // Remove current selected result
            elementList.forEach(function(option) {
                if(option.element.classList.contains('switcheroo-selected')) {
                    option.element.classList.remove('switcheroo-selected');
                }
            });
            // Set new selected result
            elementList[position].element.classList.add('switcheroo-selected');
            Switcheroo.currentlySelectedResult = elementList[position];
        }
    }

    Switcheroo.prototype.selectResult = function() {
        var result = Switcheroo.currentlySelectedResult;
        if(!result) {return;}

        // Call action is exists and is function
        var functionCheck = {};
        if(result.option.action && functionCheck.toString.call(result.option.action === '[object Function]')) {
            result.option.action(result.option);
        }
    }

})(window);
