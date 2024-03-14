(function (ko) {
    function CollapseItem(title, childrens) {
        var self = this;

        self.title = title;
        self.isCollapsed = ko.observable(false);
        self.childrens = ko.observableArray(childrens);

        self.toggleCollapse = function() {
            self.isCollapsed(!self.isCollapsed());

            ko.utils.arrayForEach(viewModel.collapseItems(), function (item) {
                if (item.title !== self.title) {
                    item.isCollapsed(false);
                }
            });
        };
    };

    function ViewModel() {
        var self = this;

        self.collapseItems = ko.observableArray([
            new CollapseItem('Обязательные для всех', ['Паспорт', 'ИНН', 'СНИЛС']),
            new CollapseItem('Обязательные для трудоустройства', ['Права', 'ПТС']),
            new CollapseItem('Специальные', ['Полис ОМС', 'Загран', 'Военный билет'])
        ]);

        self.dragStartIndex = ko.observable(-1);
        self.dragTargetIndex = ko.observable(-1);

        self.dragStartChildIndex = ko.observable({ parent: null, childIndex: -1 });
        self.dragTargetChildIndex = ko.observable({ parent: null, childIndex: -1 });

        self.preventDefaultEvent = function (event) {
            event.preventDefault();
        }

        // ---- Collapse Drag and Drop Methods ----

        self.handleDragStart = function (event, index) {
            const element = event.target;
            const collapseItem = element.closest('.collapse__item');

            element.setAttribute('draggable', 'false');

            if (collapseItem) {
                collapseItem.setAttribute('draggable', 'true');
                collapseItem.classList.add('collapse__item--dragging');

                self.dragStartIndex(index);
            }

            return collapseItem !== null;
        };

        self.handleDragEnd = function (event) {
            const element = event.target;
            const collapseItem = element.closest('.collapse__item');

            element.setAttribute('draggable', 'true');

            if (collapseItem) {
                collapseItem.setAttribute('draggable', 'false');
                collapseItem.classList.remove('collapse__item--dragging');
            }

            return true;
        };

        self.hadleDragEnter = function(event, index) {
            event.preventDefault();

            if (index === self.dragTargetIndex()) {
                return;
            }

            self.dragTargetIndex(index);
        };

        self.handleDrop = function (event) {
            if (self.dragStartChildIndex().childIndex > -1 || self.dragTargetChildIndex().childIndex > -1) {
                return;
            }

            const fromIndex = self.dragStartIndex();
            const dragElementParams = viewModel.collapseItems()[fromIndex];

            const dragElement = document.querySelector(`.collapse__item[data-title="${dragElementParams.title}"]`);
            const dropElement = event.target.closest('.draggable');

            if (dragElement && dropElement) {
                const dragRect = dragElement.getBoundingClientRect();
                const dropRect = dropElement.getBoundingClientRect();

                const dx = dropRect.left - dragRect.left;
                const dy = dropRect.top - dragRect.top;

                dragElement.style.transition = 'transform .35s ease';
                dropElement.style.transition = 'transform .35s ease';

                dragElement.style.transform = `translate(${dx}px, ${dy}px)`;
                dropElement.style.transform = `translate(-${dx}px, -${dy}px)`;

                setTimeout(() => {
                    dragElement.style.transition = '';
                    dragElement.style.transform = '';
                    dropElement.style.transition = '';
                    dropElement.style.transform = '';

                    self.handleSwap(self.dragStartIndex(), self.dragTargetIndex());

                    self.dragStartIndex(-1);
                    self.dragTargetIndex(-1);

                    document.querySelectorAll('.draggable').forEach((element) => element.classList.remove('collapse__item--dragover'));
                }, 350);
            };
        };

        self.handleSwap = function (fromIndex, toIndex) {
            if (toIndex > self.collapseItems().length - 1 || toIndex < 0) return;

            const fromCollapseItem = self.collapseItems()[fromIndex];
            const toCollapseItem = self.collapseItems()[toIndex];

            self.collapseItems()[toIndex] = fromCollapseItem;
            self.collapseItems()[fromIndex] = toCollapseItem;
            self.dragStartIndex(-1);
            self.collapseItems.valueHasMutated();
        };

        // ---- Collapse Childrens Drag and Drop Methods ----

        self.handleDragStartChild = function (event, parent, childIndex) {
            const element = event.target;
            const collapseItem = element.closest('.collapse__item');

            element.setAttribute('draggable', 'false');

            if (collapseItem) {
                collapseItem.setAttribute('draggable', 'true');
                collapseItem.classList.add('collapse__item--dragging');

                self.dragStartChildIndex({ parent: parent, childIndex: childIndex });
            }

            return collapseItem !== null;
        };

        self.handleDragEndChild = function (event, parent, childIndex) {
            const element = event.target;
            const collapseItem = element.closest('.collapse__item');

            element.setAttribute('draggable', 'true');

            if (collapseItem) {
                collapseItem.setAttribute('draggable', 'false');
                collapseItem.classList.remove('collapse__item--dragging');
            }

            return true;
        };

        self.hadleDragEnterChild = function(event, parent, childIndex) {
            event.preventDefault();

            const targetIndex = { parent, childIndex: childIndex };

            if (targetIndex.parent === self.dragTargetChildIndex().parent && targetIndex.childIndex === self.dragTargetChildIndex().childIndex) {
                return;
            }

            self.dragTargetChildIndex(targetIndex);
        };

        self.handleDropChild = function (event, parent, childIndex) {
            const fromIndex = self.dragStartChildIndex();
            const toIndex = { parent, childIndex };

            const dragElement = self.getElementFromIndex(fromIndex);
            const dropElement = self.getElementFromIndex(toIndex);

            if (dragElement && dropElement) {
                const dragRect = dragElement.getBoundingClientRect();
                const dropRect = dropElement.getBoundingClientRect();

                const dx = dropRect.left - dragRect.left;
                const dy = dropRect.top - dragRect.top;

                dragElement.style.transition = 'transform .35s ease';
                dropElement.style.transition = 'transform .35s ease';

                dragElement.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
                dropElement.style.transform = 'translate(-' + dx + 'px, -' + dy + 'px)';

                setTimeout(function () {
                    dragElement.style.transition = '';
                    dragElement.style.transform = '';
                    dropElement.style.transition = '';
                    dropElement.style.transform = '';

                    self.handleChildSwap(fromIndex, toIndex);

                    self.dragStartChildIndex({ parent: null, childIndex: -1 });
                    self.dragTargetChildIndex({ parent: null, childIndex: -1 });

                    document.querySelectorAll('.draggable').forEach((element) => element.classList.remove('collapse__item--dragover'));
                }, 350);
            }
        };

        self.handleChildSwap = function (fromIndex, toIndex) {
            const fromParent = fromIndex.parent;
            const fromChildIndex = fromIndex.childIndex;
            const toParent = toIndex.parent;
            const toChildIndex = toIndex.childIndex;

            const fromParentIndex = viewModel.collapseItems().findIndex(item => item.title === fromParent.title);
            const toParentIndex = viewModel.collapseItems().findIndex(item => item.title === toParent.title);

            if (
                fromChildIndex < 0 || toChildIndex < 0 ||
                fromChildIndex >= fromParent.childrens().length || toChildIndex >= toParent.childrens().length ||
                fromParentIndex === -1 || toParentIndex === -1
            ) {
                return;
            }

            const fromItem = fromParent.childrens()[fromChildIndex];
            const toItem = toParent.childrens()[toChildIndex];

            self.collapseItems()[fromParentIndex].childrens()[toChildIndex] = fromItem;
            self.collapseItems()[fromParentIndex].childrens()[fromChildIndex] = toItem;
            self.collapseItems()[fromParentIndex].childrens.valueHasMutated()
        };

        self.getElementFromIndex = function(index) {
            if (!index || !index.parent || index.childIndex === undefined) {
                return null;
            }

            const parentElement = document.querySelector(`.collapse__item[data-title="${index.parent.title}"]`);
            if (!parentElement) {
                return null;
            }

            const childrenElements = parentElement.querySelectorAll('.collapse__content--children');
            if (!childrenElements || index.childIndex >= childrenElements.length) {
                return null;
            }

            return childrenElements[index.childIndex];
        };
    };

    const viewModel = new ViewModel();

    ko.applyBindings(viewModel);
}(ko));
