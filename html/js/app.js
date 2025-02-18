const { useQuasar } = Quasar
const { ref } = Vue

const app = Vue.createApp({
    setup() {
        return {
            options: ref(false),
            help: ref(false),
            showblur: ref(true),
        }
    },
    methods: {
        select: function(event) {
            targetId = event.currentTarget.id;
            showBlur()
        }
    }
})

app.use(Quasar, { config: {} })
app.mount('#inventory-menus')

function showBlur() {
    $.post('https://qb-inventory/showBlur');
}

var InventoryOption = "0, 0, 0";

var totalWeight = 0;
var totalWeightOther = 0;

var playerMaxWeight = 0;
var otherMaxWeight = 0;

var otherLabel = "";

var ClickedItemData = {};

var SelectedAttachment = null;
var AttachmentScreenActive = false;
var ControlPressed = false;
var disableRightMouse = false;
var selectedItem = null;

var IsDragging = false;

function updateTextInput(value) {
    document.getElementById('item-amount-text').value = value;
}

$(document).on("keydown", function() {
    if (event.repeat) {
        return;
    }
    switch (event.keyCode) {
        case 27: // ESC
            Inventory.Close();
            break;
        case 9: // TAB
            Inventory.Close();
            break;
        case 17: // TAB
            ControlPressed = true;
            break;
    }
});

$(document).on("dblclick", ".item-slot", function(e) {
    var ItemData = $(this).data("item");
    var ItemInventory = $(this).parent().attr("data-inventory");
    if (ItemData) {
        Inventory.Close();
        console.log(ItemInventory); // Check the console for the output
        console.log(ItemData); // Check the console for the output
        $.post(
            "https://qb-inventory/UseItem",
            JSON.stringify({
                inventory: ItemInventory,
                item: ItemData,
            })
        );
    }
});

function onItemSelected(item) {
    $('#item-use').attr('data-item', JSON.stringify(item));
}

$(document).on("keyup", function() {
    switch (event.keyCode) {
        case 17: // TAB
            ControlPressed = false;
            break;
    }
});

// Player Item Info & Inventory Options Merged
var contextMenuSelectedItem = null;
var ItemInventory = null;

$(document).on("contextmenu", ".item-slot", function(e) {
    e.preventDefault();
    $('.inv-option-item').css('display', 'none');
    $(".ply-iteminfo-container").css("opacity", "0.0");
    $('#item-amount').hide();
    $('#item-amount-text').hide();
    if ($(this).data("item") != null) {
        contextMenuSelectedItem = $(this).data("item");
        ItemInventory = $(this).parent().attr("data-inventory");
        $('.inv-option-item').css('display', 'block');
        $(".ply-iteminfo-container").css("opacity", "1.0");
        $(".ply-iteminfo-container").fadeIn(150);
        $('#item-amount').show();
        $('#item-amount-text').show();
        $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
        FormatItemInfo(contextMenuSelectedItem, $(this));
        $('#item-amount').attr('max', contextMenuSelectedItem.amount);
        $('#item-amount').val(contextMenuSelectedItem.amount);
        $('#item-amount-text').val(contextMenuSelectedItem.amount);
    } else {
        $(".ply-iteminfo-container").fadeOut(100);
        $('#item-amount').hide();
        $('#item-amount-text').hide();
        $('.inv-option-item').css('display', 'none');
        $('#item-amount').val(0);
        $('#item-amount-text').val(0);
    }
});

$('#item-split').click(function() {
    var currentValue = $('#item-amount').val();
    var newValue = Math.floor(currentValue / 2);
    $('#item-amount').val(newValue);
    $('#item-amount-text').val(newValue);
});

$('#item-amount-text').on('input', function() {
    var currentValue = $(this).val();
    if (currentValue >= 0 && currentValue <= $('#item-amount').attr('max')) {
        $('#item-amount').val(currentValue);
    } else {
        $(this).val($('#item-amount').attr('max'));
        $('#item-amount').val($('#item-amount').attr('max'));
    }
});

$('#item-amount-text').on('keydown', function(e) {
    var currentValue = parseInt($(this).val());
    if (e.which === 38) {
        var newValue = currentValue + 1;
        if (newValue >= 0 && newValue <= $('#item-amount').attr('max')) {
            $('#item-amount').val(newValue);
            $(this).val(newValue);
        }
    } else if (e.which === 40) {
        var newValue = currentValue - 1;
        if (newValue >= 0 && newValue <= $('#item-amount').attr('max')) {
            $('#item-amount').val(newValue);
            $(this).val(newValue);
        }
    }
});

$(document).on("click", "#item-use", function(e) {
    if (contextMenuSelectedItem && ItemInventory) {
        Inventory.Close();
        $.post(
            "https://qb-inventory/UseItem",
            JSON.stringify({
                inventory: ItemInventory,
                item: contextMenuSelectedItem,
            })
        );
    } else {
        console.log('contextMenuSelectedItem or ItemInventory is not set correctly');
    }
});

$(document).on("click", "#item-give", function(e) {
    if (contextMenuSelectedItem && ItemInventory) {
        var itemamt = document.getElementById('item-amount-text').value
        Inventory.Close();
        $.post(
            "https://qb-inventory/GiveItem",
            JSON.stringify({
                inventory: ItemInventory,
                item: contextMenuSelectedItem,
                itemamt: itemamt
            })
        );
    } else {
        console.log('contextMenuSelectedItem or ItemInventory is not set correctly');
    }
});

// Close contextmenu on rightclick while opened
$(document).click(function(event) {
    var rightClickMenu = $(".ply-iteminfo-container");
    if (!rightClickMenu.is(event.target) && rightClickMenu.has(event.target).length === 0) {
        rightClickMenu.fadeOut(100);
    }
});

// Autostack Quickmove
function GetFirstFreeSlot($toInv, $fromSlot) {
    var retval = null;
    $.each($toInv.find(".item-slot"), function(i, slot) {
        if ($(slot).data("item") === undefined) {
            if (retval === null) {
                retval = i + 1;
            }
        }
    });
    return retval;
}

function CanQuickMove() {
    var otherinventory = otherLabel.toLowerCase();
    var retval = true;
    // if (otherinventory == "grond") {
    //     retval = false
    // } else if (otherinventory.split("-")[0] == "dropped") {
    //     retval = false;
    // }
    if (otherinventory.split("-")[0] == "player") {
        retval = false;
    }
    return retval;
}

// $(document).on("click", ".item-slot", function(event) {
//   switch (event.which) {
//      case 3:
//          fromSlot = $(this).attr("data-slot");
//           fromInventory = $(this).parent();
//
//            if ($(fromInventory).attr("data-inventory") == "player") {
//                toInventory = $(".other-inventory");
//            } else {
//                toInventory = $(".player-inventory");
//            }
//            toSlot = GetFirstFreeSlot(toInventory, $(this));
//           if ($(this).data("item") === undefined) {
//               return;
//           }
//          toAmount = $(this).data("item").amount;
//            if (toAmount > 1) {
//                toAmount = 1;
//            }
//            if (CanQuickMove()) {
//                if (toSlot === null) {
//                    InventoryError(fromInventory, fromSlot);
//                    return;
//                }
//               if (fromSlot == toSlot && fromInventory == toInventory) {
//                    return;
//                }
//                if (toAmount >= 0) {
//                    if (
//                        updateweights(
//                            fromSlot,
//                            toSlot,
//                            fromInventory,
//                           toInventory,
//                           toAmount
//                       )
//                    ) {
//                        swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
//                    }
//                }
//            } else {
//                InventoryError(fromInventory, fromSlot);
//            }
//            break;
//    }
//});

$(document).on("click", ".item-slot", function(e) {
    e.preventDefault();
    var ItemData = $(this).data("item");

    if (ItemData !== null && ItemData !== undefined) {
        if (ItemData.name !== undefined) {
            if (ItemData.name.split("_")[0] == "weapon") {
                if (!$("#weapon-attachments").length) {
                    // if (ItemData.info.attachments !== null && ItemData.info.attachments !== undefined && ItemData.info.attachments.length > 0) {
                    $(".ply-iteminfo-container").append(
                        '<button class="inv-option-item" id="weapon-attachments"><p><i style="margin-top: 1rem" class="fas fa-gun"></i></p></button>'
                    );
                    $("#weapon-attachments").hide().fadeIn(150);
                    ClickedItemData = ItemData;
                    // }
                } else if (ClickedItemData == ItemData) {
                    $("#weapon-attachments").fadeOut(150, function() {
                        $("#weapon-attachments").remove();
                    });
                    ClickedItemData = {};
                } else {
                    ClickedItemData = ItemData;
                }
            } else {
                ClickedItemData = {};
                if ($("#weapon-attachments").length) {
                    $("#weapon-attachments").fadeOut(150, function() {
                        $("#weapon-attachments").remove();
                    });
                }
            }
        } else {
            ClickedItemData = {};
            if ($("#weapon-attachments").length) {
                $("#weapon-attachments").fadeOut(150, function() {
                    $("#weapon-attachments").remove();
                });
            }
        }
    } else {
        ClickedItemData = {};
        if ($("#weapon-attachments").length) {
            $("#weapon-attachments").fadeOut(250, function() {
                $("#weapon-attachments").remove();
            });
        }
    }
});

$(document).on("click", "#inv-close", function(e) {
    e.preventDefault();
    Inventory.Close();
});

$(document).on("click", ".weapon-attachments-back", function(e) {
    e.preventDefault();
    $("#qbcore-inventory").css({ display: "block" });
    $("#qbcore-inventory").animate({
            left: 0 + "vw",
        },
        200
    );
    $(".weapon-attachments-container").animate({
            left: -100 + "vw",
        },
        200,
        function() {
            $(".weapon-attachments-container").css({ display: "none" });
        }
    );
    AttachmentScreenActive = false;
});

// function changeInventoryColor(color) {
//     $( ".player-inventory-bg" ).css( "background-color", color);
//     $( ".other-inventory-bg" ).css( "background-color", color);
//     $( ".inv-options" ).css( "background-color", color);
//     localStorage.setItem('qb-inventory-color', color);
// }

// const savedColor = localStorage.getItem('qb-inventory-color');

// if (savedColor) {
//     changeInventoryColor(savedColor)
// }

// $('#favcolor').change(function(){
//     let color = $(this).val();
//     let hexOpacity = "CC";
//     let finalColor = color+hexOpacity;
//     changeInventoryColor(finalColor);
// });

function FormatAttachmentInfo(data) {
    $.post(
        "https://qb-inventory/GetWeaponData",
        JSON.stringify({
            weapon: data.name,
            ItemData: ClickedItemData,
        }),
        function(data) {
            var AmmoLabel = "9mm";
            var Durability = 100;
            if (data.WeaponData.ammotype == "AMMO_RIFLE") {
                AmmoLabel = "7.62";
            } else if (data.WeaponData.ammotype == "AMMO_SHOTGUN") {
                AmmoLabel = "12 Gauge";
            }
            if (ClickedItemData.info.quality !== undefined) {
                Durability = ClickedItemData.info.quality;
            }

            $(".weapon-attachments-container-title").html(
                data.WeaponData.label + " | " + AmmoLabel
            );
            $(".weapon-attachments-container-description").html(
                data.WeaponData.description
            );
            $(".weapon-attachments-container-details").html(
                '<span style="font-weight: 400; letter-spacing: .1vh;">Serial</span><br> ' +
                ClickedItemData.info.serie +
                '<br><br><span style="font-weight: 400; letter-spacing: .1vh;">Durability - ' +
                Durability.toFixed() +
                '% </span> <div class="weapon-attachments-container-detail-durability"><div class="weapon-attachments-container-detail-durability-total"></div></div>'
            );
            $(".weapon-attachments-container-detail-durability-total").css({
                width: Durability + "%",
            });
            $(".weapon-attachments-container-image").attr(
                "src",
                "./attachment_images/" + data.WeaponData.name + ".png"
            );
            $(".weapon-attachments").html("");

            if (data.AttachmentData !== null && data.AttachmentData !== undefined) {
                if (data.AttachmentData.length > 0) {
                    $(".weapon-attachments-title").html(
                        '<span style="font-weight: 400; letter-spacing: .1vh;">Attachments</span>'
                    );
                    $.each(data.AttachmentData, function(i, attachment) {
                        var WeaponType = data.WeaponData.ammotype
                            .split("_")[1]
                            .toLowerCase();
                        $(".weapon-attachments").append(
                            '<div class="weapon-attachment" id="weapon-attachment-' +
                            i +
                            '"> <div class="weapon-attachment-label"><p>' +
                            attachment.label +
                            '</p></div> <div class="weapon-attachment-img"><img src="./images/' +
                            attachment.image + '"></div> </div>'
                        );
                        attachment.id = i;
                        $("#weapon-attachment-" + i).data("AttachmentData", attachment);
                    });
                } else {
                    $(".weapon-attachments-title").html(
                        '<span style="font-weight: 400; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>'
                    );
                }
            } else {
                $(".weapon-attachments-title").html(
                    '<span style="font-weight: 400; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>'
                );
            }

            handleAttachmentDrag();
        }
    );
}

var AttachmentDraggingData = {};

function handleAttachmentDrag() {
    $(".weapon-attachment").draggable({
        helper: "clone",
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        start: function(event, ui) {
            var ItemData = $(this).data("AttachmentData");
            $(this).addClass("weapon-dragging-class");
            AttachmentDraggingData = ItemData;
        },
        stop: function() {
            $(this).removeClass("weapon-dragging-class");
        },
    });
    $(".weapon-attachments-remove").droppable({
        accept: ".weapon-attachment",
        hoverClass: "weapon-attachments-remove-hover",
        drop: function(event, ui) {
            $.post(
                "https://qb-inventory/RemoveAttachment",
                JSON.stringify({
                    AttachmentData: AttachmentDraggingData,
                    WeaponData: ClickedItemData,
                }),
                function(data) {
                    if (data.Attachments !== null && data.Attachments !== undefined) {
                        if (data.Attachments.length > 0) {
                            $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(
                                150,
                                function() {
                                    $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                                    AttachmentDraggingData = null;
                                }
                            );
                        } else {
                            $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(
                                150,
                                function() {
                                    $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                                    AttachmentDraggingData = null;
                                    $(".weapon-attachments").html("");
                                }
                            );
                            $(".weapon-attachments-title").html(
                                '<span style="font-weight: 400; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>'
                            );
                        }
                    } else {
                        $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(
                            150,
                            function() {
                                $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                                AttachmentDraggingData = null;
                                $(".weapon-attachments").html("");
                            }
                        );
                        $(".weapon-attachments-title").html(
                            '<span style="font-weight: 400; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>'
                        );
                    }
                }
            );
        },
    });
}

$(document).on("click", "#weapon-attachments", function(e) {
    e.preventDefault();
    if (!Inventory.IsWeaponBlocked(ClickedItemData.name)) {
        $(".weapon-attachments-container").css({ display: "block" });
        $("#qbcore-inventory").animate({
                left: 100 + "vw",
            },
            200,
            function() {
                $("#qbcore-inventory").css({ display: "none" });
            }
        );
        $(".weapon-attachments-container").animate({
                left: 0 + "vw",
            },
            200
        );
        AttachmentScreenActive = true;
        FormatAttachmentInfo(ClickedItemData);
    } else {
        $.post(
            "https://qb-inventory/Notify",
            JSON.stringify({
                message: "Attachments are unavailable for this gun.",
                type: "error",
            })
        );
    }
});

function FormatItemInfo(itemData, dom) {
    var gender = "Man";
    if (itemData.info.gender == 1) {
        gender = "Woman";
    }

    // ID Cards
    var csnPart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-address-card'></i> " + itemData.info.citizenid + "</b></span>";
    var firstNamePart = "<span style=\"background-color: #1a1c1c; padding: 5px; margin-left: 5px;\"><b> <i class='fas fa-address-card'></i> " + itemData.info.firstname + "</b></span>";
    var lastNamePart = "<span style=\"background-color: #1a1c1c; padding: 5px; margin-left: 5px;\"><b> <i class='fas fa-address-card'></i> " + itemData.info.lastname + "</b></span>";
    var birthDatePart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-address-card'></i> " + itemData.info.birthdate + "</b></span>";
    var genderPart = "<span style=\"background-color: #1a1c1c; padding: 5px; margin-left: 5px;\"><b> <i class='fas fa-address-card'></i> " + gender + "</b></span>";
    var nationalityPart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-address-card'></i> " + itemData.info.nationality + "</b></span>";

    // Harness
    var harnessUsePart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-user-tag'></i> " + itemData.info.uses + " uses left." + "</b></span>";

    // Weapons 
    var serialNumberPart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-barcode'></i> " + itemData.info.serie + "</b></span>";
    var ammoPart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-gun'></i> " + itemData.info.ammo + "</b></span>";

    // Weapon Casing Evidence
    var streetPart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-earth-americas'></i> " + itemData.info.street + "</b></span>";
    var casingPart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-clipboard'></i> " + itemData.info.label + "</b></span>";
    var ammotypePart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-gun'></i> " + itemData.info.ammotype + "</b></span>";
    var ammolabelPart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-gun'></i> " + itemData.info.ammolabel + "</b></span>";

    // Default Items
    var weightPart = "<span style=\"background-color: #1a1c1c; padding: 5px;\"><b> <i class='fas fa-weight-hanging'></i> " + itemData.weight + "</b></span>";
    var qualityPart = "<span style=\"background-color: #1a1c1c; padding: 5px; margin-left: 5px;\"><b><i class='fas fa-tools'></i></b> " + Math.floor(itemData.info.quality) + "</span>";
    var descriptionPart = "<a style=\"font-size:13px; display: block; margin-top: 15px;\">" + itemData.description + "</a>";
    var finalHTML = "<p style=\"font-size:16px\">" + weightPart + qualityPart + "<p>" + descriptionPart + "</p>";

    let element = $('.ply-iteminfo-container');
    let fixedTopOffset = 20; // Adjust this value as needed
    element.css('top', fixedTopOffset);
    let leftOffset = $(dom).offset().left + 120;
    if (leftOffset + element.width() > $(window).width()) {
        leftOffset = $(window).width() - element.width() - 20;
    }
    element.css('left', leftOffset);
    if (itemData != null && itemData.info != "") {
        if (itemData.name == "id_card") {
            var finalIDCard = csnPart + firstNamePart + "<br><br>" + birthDatePart + genderPart + "<br><br>" + nationalityPart + "<br><br>" + weightPart + qualityPart + descriptionPart + "</p>";
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(finalIDCard);
        } else if (itemData.name == "driver_license") {
            var finalDriverseLicense = firstNamePart + lastNamePart + "<br><br>" + birthDatePart + "<br><br>" + "</p>";
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(finalDriverseLicense);
        } else if (itemData.name == "weaponlicense") {
            var finalWeaponsLicense = firstNamePart + lastNamePart + "<br><br>" + birthDatePart + "<br><br>" + "</p>";
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(finalWeaponsLicense);
        } else if (itemData.name == "lawyerpass") {
            var finalLawyerPass = firstNamePart + lastNamePart + "<br><br>" + csnPart + "<br><br>" + "</p>";
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(finalLawyerPass);
        } else if (itemData.name == "harness") {
            var finalHarness = harnessUsePart + "<br><br>" + "</p>";
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(finalHarness);
        } else if (itemData.type == "weapon") {
            var finalWeapon = ammoPart + "<br><br>" + serialNumberPart + "<br><br>" + "</p>";
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            if (itemData.info.ammo == undefined) {
                itemData.info.ammo = 0;
            } else {
                itemData.info.ammo != null ? itemData.info.ammo : 0;
            }
            if (itemData.info.attachments != null) {
                var attachmentString = "";
                $.each(itemData.info.attachments, function(i, attachment) {
                    if (i == itemData.info.attachments.length - 1) {
                        attachmentString += attachment.label;
                    } else {
                        attachmentString += attachment.label + ", ";
                    }
                });
            } else {
                $(".item-info-description").html(finalWeapon);
            }
        } else if (itemData.name == "filled_evidence_bag") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            if (itemData.info.type == "casing") {
                var finalFilledEvidenceBag = casingPart + "<br><br>" + ammotypePart + "<br><br>" + ammolabelPart + "<br><br>" + serialNumberPart + "<br><br>" + streetPart + "</span></p><br /><p>" + itemData.description + "</p>"
                $(".item-info-description").html(finalFilledEvidenceBag);
            } else if (itemData.info.type == "blood") {
                $(".item-info-description").html(
                    "<p><strong>Evidence material: </strong><span>" +
                    itemData.info.label +
                    "</span></p><p><strong>Blood type: </strong><span>" +
                    itemData.info.bloodtype +
                    "</span></p><p><strong>DNA Code: </strong><span>" +
                    itemData.info.dnalabel +
                    "</span></p><p><strong>Crime scene: </strong><span>" +
                    itemData.info.street +
                    "</span></p><br /><p>" +
                    itemData.description +
                    "</p><p style=\"font-size:11px\"><b>Weight: </b>" + itemData.weight + " | <b>Amount: </b> " + itemData.amount + " | <b>Quality: </b> " + "<a style=\"font-size:11px;color:green\">" + Math.floor(itemData.info.quality) + "</a>"
                );
            } else if (itemData.info.type == "fingerprint") {
                $(".item-info-description").html(
                    "<p><strong>Evidence material: </strong><span>" +
                    itemData.info.label +
                    "</span></p><p><strong>Fingerprint: </strong><span>" +
                    itemData.info.fingerprint +
                    "</span></p><p><strong>Crime Scene: </strong><span>" +
                    itemData.info.street +
                    "</span></p><br /><p>" +
                    itemData.description +
                    "</p><p style=\"font-size:11px\"><b>Weight: </b>" + itemData.weight + " | <b>Amount: </b> " + itemData.amount + " | <b>Quality: </b> " + "<a style=\"font-size:11px;color:green\">" + Math.floor(itemData.info.quality) + "</a>"
                );
            } else if (itemData.info.type == "dna") {
                $(".item-info-description").html(
                    "<p><strong>Evidence material: </strong><span>" +
                    itemData.info.label +
                    "</span></p><p><strong>DNA Code: </strong><span>" +
                    itemData.info.dnalabel +
                    "</span></p><br /><p>" +
                    itemData.description +
                    "</p><p style=\"font-size:11px\"><b>Weight: </b>" + itemData.weight + " | <b>Amount: </b> " + itemData.amount + " | <b>Quality: </b> " + "<a style=\"font-size:11px;color:green\">" + Math.floor(itemData.info.quality) + "</a>"
                );
            }
        } else if (
            itemData.info.costs != undefined &&
            itemData.info.costs != null
        ) {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html("<p style=\"font-size:16px\"><b> <i class='fas fa-weight-hanging'></i> </b>" + itemData.weight + " | <b><i class='fas fa-tools'></i></b> " + "<a style=\"font-size:16px\">" + Math.floor(itemData.info.quality) + "<p>" + "<a style=\"font-size:13px\">" + itemData.description + "</p>" + "</a>");
        } else if (itemData.name == "stickynote") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html("<p style=\"font-size:16px\"><b> <i class='fas fa-weight-hanging'></i> </b>" + itemData.weight + " | <b><i class='fas fa-tools'></i></b> " + "<a style=\"font-size:16px\">" + Math.floor(itemData.info.quality) + "<p>" + "<a style=\"font-size:13px\">" + itemData.description + "</p>" + "</a>");
        } else if (itemData.name == "moneybag") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html("<p style=\"font-size:16px\"><b> <i class='fas fa-weight-hanging'></i> </b>" + itemData.weight + " | <b><i class='fas fa-tools'></i></b> " + "<a style=\"font-size:16px\">" + Math.floor(itemData.info.quality) + "<p>" + "<a style=\"font-size:13px\">" + itemData.description + "</p>" + "</a>");
        } else if (itemData.name == "markedbills") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html("<p style=\"font-size:16px\"><b> <i class='fas fa-weight-hanging'></i> </b>" + itemData.weight + " | <b><i class='fas fa-tools'></i></b> " + "<a style=\"font-size:16px\">" + Math.floor(itemData.info.quality) + "<p>" + "<a style=\"font-size:13px\">" + itemData.description + "</p>" + "</a>");
        } else if (itemData.name == "visa" || itemData.name == "mastercard") {
            $(".item-info-title").html('<p>' + itemData.label + '</p>')
            var str = "" + itemData.info.cardNumber + "";
            var res = str.slice(12);
            var cardNumber = "************" + res;
            $(".item-info-description").html('<p><strong>Card Holder: </strong><span>' + itemData.info.name + '</span></p><p><strong>Citizen ID: </strong><span>' + itemData.info.citizenid + '</span></p><p><strong>Card Number: </strong><span>' + cardNumber + '</span></p><p style=\"font-size:11px\"><b>Weight: </b>' + itemData.weight + " | <b>Amount: </b> " + itemData.amount + " | <b>Quality: </b> " + "<a style=\"font-size:11px;color:green\">" + Math.floor(itemData.info.quality) + "</a>");
        } else if (itemData.name == "labkey") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html("<p>Lab: " + itemData.info.lab + "</p><p style=\"font-size:11px\"><b>Weight: </b>" + itemData.weight + " | <b>Amount: </b> " + itemData.amount + " | <b>Quality: </b> " + "<a style=\"font-size:11px;color:green\">" + Math.floor(itemData.info.quality) + "</a>");
        } else {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(finalHTML);
        }
    } else {
        $(".item-info-title").html("<p>" + itemData.label + "</p>");
        $(".item-info-description").html(finalHTML);
    }
}


function handleDragDrop() {
    $(".item-drag").draggable({
        helper: "clone",
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        cancel: ".item-nodrag",
        start: function(event, ui) {
            IsDragging = true;
            // $(this).css("background", "rgba(20,20,20,1.0)");
            $(this).find("img").css("filter", "brightness(50%)");

            //  $(".item-slot").css("border", "1px solid rgba(255, 255, 255, 0.1)");

            var itemData = $(this).data("item");
            var dragAmount = $("#item-amount").val();
            if (!itemData.useable) {
                // $("#item-use").css("background", "rgba(35,35,35, 0.5");
            }

            if (dragAmount == 0) {
                if (itemData.price != null) {
                    $(this).find(".item-slot-amount p").html("0");
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " $" + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this).find(".item-slot-amount p").html("0");
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount +
                            " " +

                            " "
                        );
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
            } else if (dragAmount > itemData.amount) {
                if (itemData.price != null) {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " $" + itemData.price);
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount +
                            " " +

                            " "
                        );
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            } else if (dragAmount > 0) {
                if (itemData.price != null) {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " $" + itemData.price);
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " $" + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount -
                            dragAmount +
                            " " +
                            (
                                (itemData.weight * (itemData.amount - dragAmount)) /
                                1000
                            ).toFixed(1) +
                            " "
                        );
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(
                            dragAmount +
                            " " +

                            " "
                        );
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
            } else {
                if ($(this).parent().attr("data-inventory") == "hotbar") {
                    // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                }
                $(".ui-draggable-dragging").find(".item-slot-key").remove();
                $(this)
                    .find(".item-slot-amount p")
                    .html(
                        itemData.amount +
                        " " +

                        " "
                    );
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            }
        },
        stop: function() {
            setTimeout(function() {
                IsDragging = false;
            }, 100); // reduced delay from 300ms to 100ms
            $(this).find("img").css("filter", "brightness(100%)");
        },
    });

    $(".item-slot").droppable({
        hoverClass: "item-slot-hoverClass",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 100);
            fromSlot = ui.draggable.attr("data-slot");
            fromInventory = ui.draggable.parent();
            toSlot = $(this).attr("data-slot");
            toInventory = $(this).parent();
            toAmount = $("#item-amount").val();

            var toDataUnique = toInventory.find("[data-slot=" + toSlot + "]").data("item");
            var fromDataUnique = fromInventory.find("[data-slot=" + fromSlot + "]").data("item");

            if (fromSlot == toSlot && fromInventory == toInventory) {
                return;
            }
            if (toAmount >= 0) {
                if (!toDataUnique) {
                    if (
                        updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)
                    ) {
                        swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                    }
                } else {
                    if (fromDataUnique.unique == toDataUnique.unique) {
                        if (!toDataUnique.combinable) {
                            if (
                                updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)
                            ) {
                                swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                            }
                        } else {
                            swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                        }
                    } else {
                        if (
                            updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)
                        ) {
                            swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                        }
                    }
                }
            }
        },
    });

    $("#item-use").droppable({
        hoverClass: "button-hover",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            if (fromData.useable) {
                if (fromData.shouldClose) {
                    Inventory.Close();
                }
                $.post(
                    "https://qb-inventory/UseItem",
                    JSON.stringify({
                        inventory: fromInventory,
                        item: fromData,
                    })
                );
            }
        },
    });

    $("#item-drop").droppable({
        hoverClass: "item-slot-hoverClass",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            amount = $("#item-amount").val();
            if (amount == 0) {
                amount = fromData.amount;
            }
            $(this).css("background", "rgba(35,35,35, 0.7");
            $.post(
                "https://qb-inventory/DropItem",
                JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                    amount: parseInt(amount),
                })
            );
        },
    });
}

function updateweights($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    var otherinventory = otherLabel.toLowerCase();
    if (otherinventory.split("-")[0] == "dropped") {
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return false;
        }
    }

    if (
        ($fromInv.attr("data-inventory") == "hotbar" &&
            $toInv.attr("data-inventory") == "player") ||
        ($fromInv.attr("data-inventory") == "player" &&
            $toInv.attr("data-inventory") == "hotbar") ||
        ($fromInv.attr("data-inventory") == "player" &&
            $toInv.attr("data-inventory") == "player") ||
        ($fromInv.attr("data-inventory") == "hotbar" &&
            $toInv.attr("data-inventory") == "hotbar")
    ) {
        return true;
    }

    if (
        ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $toInv.attr("data-inventory").split("-")[0] == "itemshop") ||
        ($fromInv.attr("data-inventory") == "crafting" &&
            $toInv.attr("data-inventory") == "crafting")
    ) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " $" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(1) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if (
        $toAmount == 0 &&
        ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" ||
            $fromInv.attr("data-inventory") == "crafting")
    ) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " $" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(1) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if (
        $toInv.attr("data-inventory").split("-")[0] == "itemshop" ||
        $toInv.attr("data-inventory") == "crafting"
    ) {
        itemData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $toInv
                .find("[data-slot=" + $toSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " $" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $toInv
                .find("[data-slot=" + $toSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(1) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if ($fromInv.attr("data-inventory") != $toInv.attr("data-inventory")) {
        fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toAmount == 0) {
            $toAmount = fromData.amount;
        }
        if (toData == null || fromData.name == toData.name) {
            if (
                $fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar"
            ) {
                totalWeight = totalWeight - fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther + fromData.weight * $toAmount;
            } else {
                totalWeight = totalWeight + fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther - fromData.weight * $toAmount;
            }
        } else {
            if (
                $fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar"
            ) {
                totalWeight = totalWeight - fromData.weight * $toAmount;
                totalWeight = totalWeight + toData.weight * toData.amount;

                totalWeightOther = totalWeightOther + fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther - toData.weight * toData.amount;
            } else {
                totalWeight = totalWeight + fromData.weight * $toAmount;
                totalWeight = totalWeight - toData.weight * toData.amount;

                totalWeightOther = totalWeightOther - fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther + toData.weight * toData.amount;
            }
        }
    }

    if (
        totalWeight > playerMaxWeight ||
        (totalWeightOther > otherMaxWeight &&
            $fromInv.attr("data-inventory").split("-")[0] != "itemshop" &&
            $fromInv.attr("data-inventory") != "crafting")
    ) {
        InventoryError($fromInv, $fromSlot);
        return false;
    }

    var per = (totalWeight / 1000) / (playerMaxWeight / 100000)
    $(".pro").css("width", per + "%")
    $("#player-inv-weight").html(
        // '<i class="fas fa-dumbbell"></i> ' +
        (parseInt(totalWeight) / 1000).toFixed(2) +
        "kg" +
        "/" +
        (playerMaxWeight / 1000).toFixed(2) +
        "kg"
    );
    if (
        $fromInv.attr("data-inventory").split("-")[0] != "itemshop" &&
        $toInv.attr("data-inventory").split("-")[0] != "itemshop" &&
        $fromInv.attr("data-inventory") != "crafting" &&
        $toInv.attr("data-inventory") != "crafting"
    ) {
        $("#other-inv-label").html(otherLabel);
        $("#other-inv-weight").html(
            // '<i class="fas fa-dumbbell"></i> ' +
            (parseInt(totalWeightOther) / 1000).toFixed(2) +
            "/" +
            (otherMaxWeight / 1000).toFixed(2)
        );
        var per1 = (totalWeightOther / 1000) / (otherMaxWeight / 100000)
        $(".pro1").css("width", per1 + "%");
    }

    return true;
}

var combineslotData = null;

$(document).on("click", ".CombineItem", function(e) {
    e.preventDefault();
    if (combineslotData.toData.combinable.anim != null) {
        $.post(
            "https://qb-inventory/combineWithAnim",
            JSON.stringify({
                combineData: combineslotData.toData.combinable,
                usedItem: combineslotData.toData.name,
                requiredItem: combineslotData.fromData.name,
            })
        );
    } else {
        $.post(
            "https://qb-inventory/combineItem",
            JSON.stringify({
                reward: combineslotData.toData.combinable.reward,
                toItem: combineslotData.toData.name,
                fromItem: combineslotData.fromData.name,
            })
        );
    }
    Inventory.Close();
});

$(document).on("click", ".SwitchItem", function(e) {
    e.preventDefault();
    $(".combine-option-container").hide();

    optionSwitch(
        combineslotData.fromSlot,
        combineslotData.toSlot,
        combineslotData.fromInv,
        combineslotData.toInv,
        combineslotData.toAmount,
        combineslotData.toData,
        combineslotData.fromData
    );
});

function optionSwitch(
    $fromSlot,
    $toSlot,
    $fromInv,
    $toInv,
    $toAmount,
    toData,
    fromData
) {
    fromData.slot = parseInt($toSlot);

    $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
    $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

    if ($toSlot < 6) {
        $toInv
            .find("[data-slot=" + $toSlot + "]")
            .html(
                '<div class="item-slot-key"><p>' +
                $toSlot +
                '</p></div><div class="item-slot-img"><img src="images/' +
                fromData.image +
                '" alt="' +
                fromData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                fromData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                fromData.label +
                "</p></div>"
            );
    } else {
        $toInv
            .find("[data-slot=" + $toSlot + "]")
            .html(
                '<div class="item-slot-img"><img src="images/' +
                fromData.image +
                '" alt="' +
                fromData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                fromData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                fromData.label +
                "</p></div>"
            );
    }

    toData.slot = parseInt($fromSlot);

    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
    $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-nodrag");

    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

    if ($fromSlot < 6) {
        $fromInv
            .find("[data-slot=" + $fromSlot + "]")
            .html(
                '<div class="item-slot-key"><p>' +
                $fromSlot +
                '</p></div><div class="item-slot-img"><img src="images/' +
                toData.image +
                '" alt="' +
                toData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                toData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                toData.label +
                "</p></div>"
            );
    } else {
        $fromInv
            .find("[data-slot=" + $fromSlot + "]")
            .html(
                '<div class="item-slot-img"><img src="images/' +
                toData.image +
                '" alt="' +
                toData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                toData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                toData.label +
                "</p></div>"
            );
    }

    $.post(
        "https://qb-inventory/SetInventoryData",
        JSON.stringify({
            fromInventory: $fromInv.attr("data-inventory"),
            toInventory: $toInv.attr("data-inventory"),
            fromSlot: $fromSlot,
            toSlot: $toSlot,
            fromAmount: $toAmount,
            toAmount: toData.amount,
        })
    );
}

function swap($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
    toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
    var otherinventory = otherLabel.toLowerCase();

    if (otherinventory.split("-")[0] == "dropped") {
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return;
        }
    }

    if (fromData !== undefined && fromData.amount >= $toAmount) {
        if (fromData.unique && $toAmount > 1) {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if (
            ($fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar") &&
            $toInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $toInv.attr("data-inventory") == "crafting"
        ) {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if (
            $toAmount == 0 &&
            $fromInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $fromInv.attr("data-inventory") == "crafting"
        ) {
            InventoryError($fromInv, $fromSlot);
            return;
        } else if ($toAmount == 0) {
            $toAmount = fromData.amount;
        }
        if (
            (toData != undefined || toData != null) &&
            toData.name == fromData.name &&
            !fromData.unique
        ) {
            var newData = [];
            newData.name = toData.name;
            newData.label = toData.label;
            newData.amount = parseInt($toAmount) + parseInt(toData.amount);
            newData.type = toData.type;
            newData.description = toData.description;
            newData.image = toData.image;
            newData.weight = toData.weight;
            newData.info = toData.info;
            newData.useable = toData.useable;
            newData.unique = toData.unique;
            newData.slot = parseInt($toSlot);

            if (newData.name == fromData.name) {
                if (newData.info.quality !== fromData.info.quality) {
                    InventoryError($fromInv, $fromSlot);
                    $.post(
                        "https://qb-inventory/Notify",
                        JSON.stringify({
                            message: "You can not stack items which are not the same quality.",
                            type: "error",
                        })
                    );
                    return;

                }
            }

            if (fromData.amount == $toAmount) {
                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newData.label + "</p></div>";
                // if (newData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newData.name)) {
                ItemLabel =
                    '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                    newData.label +
                    "</p></div>";
                // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newData.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(newData.name)) {
                if (newData.info.quality == undefined) {
                    newData.info.quality = 100.0;
                }
                var QualityColor = "rgb(250, 244, 165)";
                if (newData.info.quality < 25) {
                    QualityColor = "rgb(192, 57, 43)";
                } else if (newData.info.quality > 25 && newData.info.quality < 50) {
                    QualityColor = "rgb(36, 15, 23)";
                } else if (newData.info.quality >= 50) {
                    QualityColor = "rgb(250, 244, 165)";
                }
                if (newData.info.quality !== undefined) {
                    qualityLabel = newData.info.quality.toFixed();
                } else {
                    qualityLabel = newData.info.quality;
                }
                if (newData.info.quality == 0) {
                    qualityLabel = "BROKEN";
                }
                $toInv
                    .find("[data-slot=" + $toSlot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        width: qualityLabel + "%",
                        "background-color": QualityColor,
                    })
                    .find("p")
                    .html(qualityLabel);
                // }
                // }

                $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-drag");
                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-nodrag");

                $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .html(
                        '<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                    );
            } else if (fromData.amount > $toAmount) {
                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt(fromData.amount - $toAmount);
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newData.label + "</p></div>";
                // if (newData.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(newData.name)) {
                ItemLabel =
                    '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                    newData.label +
                    "</p></div>";
                // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newData.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(newData.name)) {
                if (newData.info.quality == undefined) {
                    newData.info.quality = 100.0;
                }
                var QualityColor = "rgb(250, 244, 165)";
                if (newData.info.quality < 25) {
                    QualityColor = "rgb(192, 57, 43)";
                } else if (newData.info.quality > 25 && newData.info.quality < 50) {
                    QualityColor = "rgb(36, 15, 23)";
                } else if (newData.info.quality >= 50) {
                    QualityColor = "rgb(250, 244, 165)";
                }
                if (newData.info.quality !== undefined) {
                    qualityLabel = newData.info.quality.toFixed();
                } else {
                    qualityLabel = newData.info.quality;
                }
                if (newData.info.quality == 0) {
                    qualityLabel = "BROKEN";
                }
                $toInv
                    .find("[data-slot=" + $toSlot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        width: qualityLabel + "%",
                        "background-color": QualityColor,
                    })
                    .find("p")
                    .html(qualityLabel);
                // }
                // }

                // From Data zooi
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataFrom.image +
                            '" alt="' +
                            newDataFrom.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataFrom.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " $" +
                            newDataFrom.price +
                            '</p></div><div class="item-slot-label"><p>' +
                            newDataFrom.label +
                            "</p></div>"
                        );
                } else {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // }
                    // }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                    if (newDataFrom.info.quality == undefined) {
                        newDataFrom.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(250, 244, 165)";
                    if (newDataFrom.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (
                        newDataFrom.info.quality > 25 &&
                        newDataFrom.info.quality < 50
                    ) {
                        QualityColor = "rgb(36, 15, 23)";
                    } else if (newDataFrom.info.quality >= 50) {
                        QualityColor = "rgb(250, 244, 165)";
                    }
                    if (newDataFrom.info.quality !== undefined) {
                        qualityLabel = newDataFrom.info.quality.toFixed();
                    } else {
                        qualityLabel = newDataFrom.info.quality;
                    }
                    if (newDataFrom.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            width: qualityLabel + "%",
                            "background-color": QualityColor,
                        })
                        .find("p")
                        .html(qualityLabel);
                    // }
                    // }
                }
            }
            $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
            $.post(
                "https://qb-inventory/SetInventoryData",
                JSON.stringify({
                    fromInventory: $fromInv.attr("data-inventory"),
                    toInventory: $toInv.attr("data-inventory"),
                    fromSlot: $fromSlot,
                    toSlot: $toSlot,
                    fromAmount: $toAmount,
                })
            );
        } else {
            if (fromData.amount == $toAmount) {
                if (toData && toData.unique) {
                    InventoryError($fromInv, $fromSlot);
                    return;
                }
                if (
                    toData != undefined &&
                    toData.combinable != null &&
                    isItemAllowed(fromData.name, toData.combinable.accept)
                ) {
                    $.post(
                        "https://qb-inventory/getCombineItem",
                        JSON.stringify({ item: toData.combinable.reward }),
                        function(item) {
                            $(".combine-option-text").html(
                                "<p>If you combine these items you get: <b>" +
                                item.label +
                                "</b></p>"
                            );
                        }
                    );
                    $(".combine-option-container").fadeIn(100);
                    combineslotData = [];
                    combineslotData.fromData = fromData;
                    combineslotData.toData = toData;
                    combineslotData.fromSlot = $fromSlot;
                    combineslotData.toSlot = $toSlot;
                    combineslotData.fromInv = $fromInv;
                    combineslotData.toInv = $toInv;
                    combineslotData.toAmount = $toAmount;
                    return;
                }

                fromData.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + fromData.label + "</p></div>";
                // if (fromData.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(fromData.name)) {
                ItemLabel =
                    '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                    fromData.label +
                    "</p></div>";
                // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (fromData.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(fromData.name)) {
                if (fromData.info.quality == undefined) {
                    fromData.info.quality = 100.0;
                }
                var QualityColor = "rgb(250, 244, 165)";
                if (fromData.info.quality < 25) {
                    QualityColor = "rgb(192, 57, 43)";
                } else if (
                    fromData.info.quality > 25 &&
                    fromData.info.quality < 50
                ) {
                    QualityColor = "rgb(36, 15, 23)";
                } else if (fromData.info.quality >= 50) {
                    QualityColor = "rgb(250, 244, 165)";
                }
                if (fromData.info.quality !== undefined) {
                    qualityLabel = fromData.info.quality.toFixed();
                } else {
                    qualityLabel = fromData.info.quality;
                }
                if (fromData.info.quality == 0) {
                    qualityLabel = "BROKEN";
                }
                $toInv
                    .find("[data-slot=" + $toSlot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        width: qualityLabel + "%",
                        "background-color": QualityColor,
                    })
                    .find("p")
                    .html(qualityLabel);
                // }
                // }

                if (toData != undefined) {
                    toData.slot = parseInt($fromSlot);

                    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + toData.label + "</p></div>";
                    // if (toData.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(toData.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        toData.label +
                        "</p></div>";
                    // }
                    // }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (toData.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(toData.name)) {
                    if (toData.info.quality == undefined) {
                        toData.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(250, 244, 165)";
                    if (toData.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (toData.info.quality > 25 && toData.info.quality < 50) {
                        QualityColor = "rgb(36, 15, 23)";
                    } else if (toData.info.quality >= 50) {
                        QualityColor = "rgb(250, 244, 165)";
                    }
                    if (toData.info.quality !== undefined) {
                        qualityLabel = toData.info.quality.toFixed();
                    } else {
                        qualityLabel = toData.info.quality;
                    }
                    if (toData.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            width: qualityLabel + "%",
                            "background-color": QualityColor,
                        })
                        .find("p")
                        .html(qualityLabel);
                    // }
                    // }

                    $.post(
                        "https://qb-inventory/SetInventoryData",
                        JSON.stringify({
                            fromInventory: $fromInv.attr("data-inventory"),
                            toInventory: $toInv.attr("data-inventory"),
                            fromSlot: $fromSlot,
                            toSlot: $toSlot,
                            fromAmount: $toAmount,
                            toAmount: toData.amount,
                        })
                    );
                } else {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-drag");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .addClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    }

                    $.post(
                        "https://qb-inventory/SetInventoryData",
                        JSON.stringify({
                            fromInventory: $fromInv.attr("data-inventory"),
                            toInventory: $toInv.attr("data-inventory"),
                            fromSlot: $fromSlot,
                            toSlot: $toSlot,
                            fromAmount: $toAmount,
                        })
                    );
                }
                $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
            } else if (
                fromData.amount > $toAmount &&
                (toData == undefined || toData == null)
            ) {
                var newDataTo = [];
                newDataTo.name = fromData.name;
                newDataTo.label = fromData.label;
                newDataTo.amount = parseInt($toAmount);
                newDataTo.type = fromData.type;
                newDataTo.description = fromData.description;
                newDataTo.image = fromData.image;
                newDataTo.weight = fromData.weight;
                newDataTo.info = fromData.info;
                newDataTo.useable = fromData.useable;
                newDataTo.unique = fromData.unique;
                newDataTo.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newDataTo);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newDataTo.label + "</p></div>";
                // if (newDataTo.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                ItemLabel =
                    '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                    newDataTo.label +
                    "</p></div>";
                // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newDataTo.name.split("_")[0] == "weapon") {
                // if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                if (newDataTo.info.quality == undefined) {
                    newDataTo.info.quality = 100.0;
                }
                var QualityColor = "rgb(250, 244, 165)";
                if (newDataTo.info.quality < 25) {
                    QualityColor = "rgb(192, 57, 43)";
                } else if (
                    newDataTo.info.quality > 25 &&
                    newDataTo.info.quality < 50
                ) {
                    QualityColor = "rgb(36, 15, 23)";
                } else if (newDataTo.info.quality >= 50) {
                    QualityColor = "rgb(250, 244, 165)";
                }
                if (newDataTo.info.quality !== undefined) {
                    qualityLabel = newDataTo.info.quality.toFixed();
                } else {
                    qualityLabel = newDataTo.info.quality;
                }
                if (newDataTo.info.quality == 0) {
                    qualityLabel = "BROKEN";
                }
                $toInv
                    .find("[data-slot=" + $toSlot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        width: qualityLabel + "%",
                        "background-color": QualityColor,
                    })
                    .find("p")
                    .html(qualityLabel);
                // }
                // }

                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt(fromData.amount - $toAmount);
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);

                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataFrom.image +
                            '" alt="' +
                            newDataFrom.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataFrom.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " $" +
                            newDataFrom.price +
                            '</p></div><div class="item-slot-label"><p>' +
                            newDataFrom.label +
                            "</p></div>"
                        );
                } else {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // }
                    // }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                    if (newDataFrom.info.quality == undefined) {
                        newDataFrom.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(250, 244, 165)";
                    if (newDataFrom.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (
                        newDataFrom.info.quality > 25 &&
                        newDataFrom.info.quality < 50
                    ) {
                        QualityColor = "rgb(36, 15, 23)";
                    } else if (newDataFrom.info.quality >= 50) {
                        QualityColor = "rgb(250, 244, 165)";
                    }
                    if (newDataFrom.info.quality !== undefined) {
                        qualityLabel = newDataFrom.info.quality.toFixed();
                    } else {
                        qualityLabel = newDataFrom.info.quality;
                    }
                    if (newDataFrom.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            width: qualityLabel + "%",
                            "background-color": QualityColor,
                        })
                        .find("p")
                        .html(qualityLabel);
                    // }
                    // }
                }
                $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
                $.post(
                    "https://qb-inventory/SetInventoryData",
                    JSON.stringify({
                        fromInventory: $fromInv.attr("data-inventory"),
                        toInventory: $toInv.attr("data-inventory"),
                        fromSlot: $fromSlot,
                        toSlot: $toSlot,
                        fromAmount: $toAmount,
                    })
                );
            } else {
                InventoryError($fromInv, $fromSlot);
            }
        }
    } else {
        //InventoryError($fromInv, $fromSlot);
    }
    handleDragDrop();
}

function isItemAllowed(item, allowedItems) {
    var retval = false;
    $.each(allowedItems, function(index, i) {
        if (i == item) {
            retval = true;
        }
    });
    return retval;
}

function InventoryError($elinv, $elslot) {
    $elinv
        .find("[data-slot=" + $elslot + "]")
        .css("background", "rgba(156, 20, 20, 0.5)")
        .css("transition", "background 500ms");
    setTimeout(function() {
        $elinv
            .find("[data-slot=" + $elslot + "]")
            .css("background", "rgba(255, 255, 255, 0.3)");
    }, 500);
    $.post("https://qb-inventory/PlayDropFail", JSON.stringify({}));
}

var requiredItemOpen = false;

(() => {
    Inventory = {};

    Inventory.slots = 40;

    Inventory.dropslots = 32;
    Inventory.droplabel = "Ground";
    Inventory.dropmaxweight = 100000;

    Inventory.Error = function() {
        $.post("https://qb-inventory/PlayDropFail", JSON.stringify({}));
    };

    Inventory.IsWeaponBlocked = function(WeaponName) {
        var DurabilityBlockedWeapons = [
            "weapon_unarmed",
            "weapon_stickybomb",
        ];

        var retval = false;
        $.each(DurabilityBlockedWeapons, function(i, name) {
            if (name == WeaponName) {
                retval = true;
            }
        });
        return retval;
    };

    Inventory.QualityCheck = function(item, IsHotbar, IsOtherInventory) {
        // if (!Inventory.IsWeaponBlocked(item.name)) {
        // if (item.name.split("_")[0] == "weapon") {
        if (item.info.quality == undefined) {
            item.info.quality = 100;
        }
        var QualityColor = "rgb(250, 244, 165)";
        if (item.info.quality < 25) {
            QualityColor = "rgb(192, 57, 43)";
        } else if (item.info.quality > 25 && item.info.quality < 50) {
            QualityColor = "rgb(36, 15, 23)";
        } else if (item.info.quality >= 50) {
            QualityColor = "rgb(250, 244, 165)";
        }
        if (item.info.quality !== undefined) {
            qualityLabel = item.info.quality.toFixed();
        } else {
            qualityLabel = item.info.quality;
        }
        if (item.info.quality == 0) {
            qualityLabel = "BROKEN";
            if (!IsOtherInventory) {
                if (!IsHotbar) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            width: "100%",
                            "background-color": QualityColor,
                        })
                        .find("p")
                        .html(qualityLabel);
                } else {
                    $(".z-hotbar-inventory")
                        .find("[data-zhotbarslot=" + item.slot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            width: "100%",
                            "background-color": QualityColor,
                        })
                        .find("p")
                        .html(qualityLabel);
                }
            } else {
                $(".other-inventory")
                    .find("[data-slot=" + item.slot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        width: "100%",
                        "background-color": QualityColor,
                    })
                    .find("p")
                    .html(qualityLabel);
            }
        } else {
            if (!IsOtherInventory) {
                if (!IsHotbar) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            width: qualityLabel + "%",
                            "background-color": QualityColor,
                        })
                        .find("p")
                        .html(qualityLabel);
                } else {
                    $(".z-hotbar-inventory")
                        .find("[data-zhotbarslot=" + item.slot + "]")
                        .find(".item-slot-quality-bar")
                        .css({
                            width: qualityLabel + "%",
                            "background-color": QualityColor,
                        })
                        .find("p")
                        .html(qualityLabel);
                }
            } else {
                $(".other-inventory")
                    .find("[data-slot=" + item.slot + "]")
                    .find(".item-slot-quality-bar")
                    .css({
                        width: qualityLabel + "%",
                        "background-color": QualityColor,
                    })
                    .find("p")
                    .html(qualityLabel);
            }
        }
        // }
        // }
    };

    Inventory.Open = function(data) {
        totalWeight = 0;
        totalWeightOther = 0;
        var skullcolor = "#F86969";

        $(".player-inv-label").html('Player');
        $(".player-inventory").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();
        $(".ply-iteminfo-container").css("opacity", "0.0");

        $(".player-name-title").html('Name');
        $(".player-name").html(data.pName);
        $(".phone-number-title").html('Phone Number');
        $(".phone-number").html(data.pNumber);
        $(".player-id-title").html('State ID');
        $(".player-id").html(data.pID);
        $(".citizen-id-title").html('Citizen ID');
        $(".citizen-id").html(data.pCID);

        $(".skull-damage-title").html(data.pStress);

        $(".body-damage-title").html(data.pDamage + "%");
        $(".skull-damage-line").css({
            width: data.pDamage + "px",
            "background-color": skullcolor,
        });

        if (requiredItemOpen) {
            $(".requiredItem-container").hide();
            requiredItemOpen = false;
        }

        $("#qbcore-inventory").fadeIn(150);
        if (data.other != null && data.other != "") {
            $(".other-inventory").attr("data-inventory", data.other.name);
        } else {
            $(".other-inventory").attr("data-inventory", 0);
        }

        for (i = 1; i < 7; i++) {
            $(".player-inventory").append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }

        var firstSlots = $(".player-inventory-first");
        for (i = 111; i < 116; i++) {
            firstSlots.append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        $(".player-inventory").append(firstSlots);

        var secondSlots = $(".player-inventory-second");
        for (i = 42; i < 47; i++) {
            secondSlots.append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        $(".player-inventory").append(secondSlots);

        var backpackSlots = $(".player-inventory-backpack");
        for (i = 158; i < 188; i++) {
            backpackSlots.append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        $(".player-inventory").append(backpackSlots);

        var remainingSlots = $(".player-inventory");
        for (i = 7; i < data.slots + 1; i++) {
            if (i == 43) {
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            } else {
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }
        $(".player-inventory").append(remainingSlots);

        if (data.other != null && data.other != "") {
            for (i = 1; i < data.other.slots + 1; i++) {
                $(".other-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        } else {
            for (i = 1; i < Inventory.dropslots + 1; i++) {
                $(".other-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }

        if (data.inventory !== null) {
            $.each(data.inventory, function(i, item) {
                if (item != null) {
                    totalWeight += item.weight * item.amount;
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    // if (item.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(item.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        item.label +
                        "</p></div>";
                    // }
                    // }
                    if (item.slot < 6) {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                item.slot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    } else if (item.slot == 43) {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    } else {
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    }
                    Inventory.QualityCheck(item, false, false);
                }
            });
        }

        if (
            data.other != null &&
            data.other != "" &&
            data.other.inventory != null
        ) {
            $.each(data.other.inventory, function(i, item) {
                if (item != null) {
                    totalWeightOther += item.weight * item.amount;
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    // if (item.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(item.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        item.label +
                        "</p></div>";
                    // }
                    // }
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    if (item.price != null) {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " $" +
                                item.price +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                    Inventory.QualityCheck(item, false, true);
                }
            });
        }

        var per = (totalWeight / 1000) / (data.maxweight / 100000)
        $(".pro").css("width", per + "%");
        $("#player-inv-weight").html(
            // '<i class="fas fa-dumbbell"></i> ' +
            (totalWeight / 1000).toFixed(2) +
            "kg" +
            "/" +
            (data.maxweight / 1000).toFixed(2) +
            "kg"
        );
        playerMaxWeight = data.maxweight;
        if (data.other != null) {
            var name = data.other.name.toString();
            if (
                name != null &&
                (name.split("-")[0] == "itemshop" || name == "crafting")
            ) {
                $("#other-inv-label").html(data.other.label);
            } else {
                $("#other-inv-label").html(data.other.label);
                $("#other-inv-weight").html(
                    // '<i class="fas fa-dumbbell"></i> ' +
                    (totalWeightOther / 1000).toFixed(2) +
                    "kg" +
                    "/" +
                    (data.other.maxweight / 1000).toFixed(2) +
                    "kg"
                );
            }
            otherMaxWeight = data.other.maxweight;
            otherLabel = data.other.label;
            var per1 = (totalWeightOther / 1000) / (otherMaxWeight / 100000)
            $(".pro1").css("width", per1 + "%");
        } else {
            $("#other-inv-label").html(Inventory.droplabel);
            $("#other-inv-weight").html(
                // '<i class="fas fa-dumbbell"></i> ' +
                (totalWeightOther / 1000).toFixed(2) +
                "kg" +
                "/" +
                (Inventory.dropmaxweight / 1000).toFixed(2) +
                "kg"
            );
            otherMaxWeight = Inventory.dropmaxweight;
            otherLabel = Inventory.droplabel;
            var per1 = (totalWeightOther / 1000) / (otherMaxWeight / 100000)
            $(".pro1").css("width", per1 + "%");
        }

        $.each(data.maxammo, function(index, ammotype) {
            $("#" + index + "_ammo")
                .find(".ammo-box-amount")
                .css({ height: "0%" });
        });

        if (data.Ammo !== null) {
            $.each(data.Ammo, function(i, amount) {
                var Handler = i.split("_");
                var Type = Handler[1].toLowerCase();
                if (amount > data.maxammo[Type]) {
                    amount = data.maxammo[Type];
                }
                var Percentage = (amount / data.maxammo[Type]) * 100;

                $("#" + Type + "_ammo")
                    .find(".ammo-box-amount")
                    .css({ height: Percentage + "%" });
                $("#" + Type + "_ammo")
                    .find("span")
                    .html(amount);
            });
        }

        handleDragDrop();
    };

    Inventory.Close = function() {
        // $(".item-slot").css("border", "1px solid rgba(255, 255, 255, 0.1)");
        $(".ply-hotbar-inventory").css("display", "block");
        // $(".ply-iteminfo-container").css("display", "none");
        $(".ply-iteminfo-container").css("opacity", "0.0");
        $("#qbcore-inventory").fadeOut(150);
        $(".combine-option-container").hide();
        $(".item-slot").remove();
        if ($("#rob-money").length) {
            $("#rob-money").remove();
        }
        $.post("https://qb-inventory/CloseInventory", JSON.stringify({}));

        if (AttachmentScreenActive) {
            $("#qbcore-inventory").css({ left: "0vw" });
            $(".weapon-attachments-container").css({ left: "-100vw" });
            AttachmentScreenActive = false;
        }

        if (ClickedItemData !== null) {
            $("#weapon-attachments").fadeOut(250, function() {
                $("#weapon-attachments").remove();
                ClickedItemData = {};
            });
        }
    };

    Inventory.Update = function(data) {
        totalWeight = 0;
        totalWeightOther = 0;
        $(".player-inventory").find(".item-slot").remove();
        $(".player-inventory-first").find(".item-slot").remove();
        $(".player-inventory-second").find(".item-slot").remove();
        $(".player-inventory-backpack").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();
        if (data.error) {
            Inventory.Error();
        }
        var firstSlots = $(".player-inventory-first");
        for (i = 111; i < 116; i++) {
            firstSlots.append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        $(".player-inventory").append(firstSlots);

        var secondSlots = $(".player-inventory-second");
        for (i = 42; i < 47; i++) {
            secondSlots.append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        $(".player-inventory").append(secondSlots);

        var backpackSlots = $(".player-inventory-backpack");
        for (i = 158; i < 188; i++) {
            backpackSlots.append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        $(".player-inventory").append(backpackSlots);

        var remainingSlots = $(".player-inventory");
        for (i = 7; i < data.slots + 1; i++) {
            if (i == 43) {
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            } else {
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }
        $(".player-inventory").append(remainingSlots);

        $.each(data.inventory, function(i, item) {
            if (item != null) {
                totalWeight += item.weight * item.amount;
                if (item.slot < 6) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            item.slot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                } else if (item.slot == 43) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                } else {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                }
            }
        });

        var per = (totalWeight / 1000) / (data.maxweight / 100000)
        $(".pro").css("width", per + "%");
        $("#player-inv-weight").html(
            // '<i class="fas fa-dumbbell"></i> ' +
            (totalWeight / 1000).toFixed(2) +
            "kg" +
            "/" +
            (data.maxweight / 1000).toFixed(2) +
            "kg"
        );

        handleDragDrop();
    };

    Inventory.ToggleHotbar = function(data) {
        if (data.open) {
            $(".z-hotbar-inventory").html("");
            for (i = 1; i < 6; i++) {
                var elem =
                    '<div class="z-hotbar-item-slot" data-zhotbarslot="' +
                    i +
                    '"> <div class="z-hotbar-item-slot-key"><p>' +
                    i +
                    '</p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
                $(".z-hotbar-inventory").append(elem);
            }
            // var elem =
            //     '<div class="z-hotbar-item-slot" data-zhotbarslot="43"> <div class="z-hotbar-item-slot-key"><p>6 <i style="top: -62px; left: 58px;" class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
            // $(".z-hotbar-inventory").append(elem);
            $.each(data.items, function(i, item) {
                if (item != null) {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    // if (item.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(item.name)) {
                    ItemLabel =
                        '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                        item.label +
                        "</p></div>";
                    // }
                    // }
                    if (item.slot == 43) {
                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>6 <i style="top: -62px; left: 58px;" class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="z-hotbar-item-slot-amount-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>' +
                                item.slot +
                                '</p></div><div class="z-hotbar-item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="z-hotbar-item-slot-amount-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }
                    Inventory.QualityCheck(item, true, false);
                }
            });
            $(".z-hotbar-inventory").fadeIn(150);
        } else {
            $(".z-hotbar-inventory").fadeOut(150, function() {
                $(".z-hotbar-inventory").html("");
            });
        }
    };

    Inventory.UseItem = function(data) {
        $(".itembox-container").hide();
        $(".itembox-container").fadeIn(250);
        $("#itembox-action").html("<p>Equip</p>");
        $("#itembox-label").html("<p>" + data.item.label + "</p>");
        $("#itembox-image").html(
            '<div class="item-slot-img"><img src="images/' +
            data.item.image +
            '" alt="' +
            data.item.name +
            '" /></div>'
        );
        setTimeout(function() {
            $(".itembox-container").fadeOut(250);
        }, 2000);
    };

    var itemBoxtimer = null;
    var requiredTimeout = null;

    Inventory.itemBox = function(data) {
        if (itemBoxtimer !== null) {
            clearTimeout(itemBoxtimer);
        }

        var type = "Equip " + data.itemAmount + "x";
        if (data.type == "add") {
            type = "Received " + data.itemAmount;
        } else if (data.type == "remove") {
            type = "Removed " + data.itemAmount;
        }

        // Check if there's an existing item box
        var $existingItemBox = $(".itembox-container:not(.template)");

        if ($existingItemBox.length > 0) {
            // Update existing item box content
            $existingItemBox.find("#itembox-action p").text(type);
            $existingItemBox.find("#itembox-label p").text(data.item.label);
            $existingItemBox.find(".item-slot-img-itembox img").attr("src", "images/" + data.item.image).attr("alt", data.item.name);
        } else {
            // Create a new item box
            var $itembox = $(".itembox-container.template").clone();
            $itembox.removeClass("template");
            $itembox.html(
                '<div id="itembox-action"><p>' +
                type +
                '</p></div><div id="itembox-label"><p>' +
                data.item.label +
                '</p></div><div class="item-slot-img-itembox"><img src="images/' +
                data.item.image +
                '" alt="' +
                data.item.name +
                '" /></div>'
            );
            $(".itemboxes-container").prepend($itembox);
            $itembox.fadeIn(250);
        }

        // Show background
        $(".itemboxes-container-background").fadeIn(250);

        // Set timeout for removal
        setTimeout(function() {
            $(".itemboxes-container-background").fadeOut(300);
            $(".itembox-container:not(.template)").fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    };

    Inventory.RequiredItem = function(data) {
        if (requiredTimeout !== null) {
            clearTimeout(requiredTimeout);
        }
        if (data.toggle) {
            if (!requiredItemOpen) {
                $(".requiredItem-container").html("");
                $.each(data.items, function(index, item) {
                    var element =
                        '<div class="requiredItem-box"><div id="requiredItem-action">Required</div><div id="requiredItem-label"><p>' +
                        item.label +
                        '</p></div><div id="requiredItem-image"><div class="item-slot-img"><img src="images/' +
                        item.image +
                        '" alt="' +
                        item.name +
                        '" /></div></div></div>';
                    $(".requiredItem-container").hide();
                    $(".requiredItem-container").append(element);
                    $(".requiredItem-container").fadeIn(100);
                });
                requiredItemOpen = true;
            }
        } else {
            $(".requiredItem-container").fadeOut(100);
            requiredTimeout = setTimeout(function() {
                $(".requiredItem-container").html("");
                requiredItemOpen = false;
            }, 100);
        }
    };

    window.onload = function(e) {
        window.addEventListener("message", function(event) {
            switch (event.data.action) {
                case "open":
                    Inventory.Open(event.data);
                    break;
                case "close":
                    Inventory.Close();
                    break;
                case "update":
                    Inventory.Update(event.data);
                    break;
                case "itemBox":
                    Inventory.itemBox(event.data);
                    break;
                case "requiredItem":
                    Inventory.RequiredItem(event.data);
                    break;
                case "toggleHotbar":
                    Inventory.ToggleHotbar(event.data);
                    break;
                case "RobMoney":
                    $(".inv-options-list").append(
                        '<div class="inv-option-item" id="rob-money"><p><i style="margin-top: 1rem" class="fas fa-hand-holding-dollar"></i></p></div>'
                    );
                    $("#rob-money").data("TargetId", event.data.TargetId);
                    break;
            }
        });
    };
})();

$(document).on("click", "#rob-money", function(e) {
    e.preventDefault();
    var TargetId = $(this).data("TargetId");
    $.post(
        "https://qb-inventory/RobMoney",
        JSON.stringify({
            TargetId: TargetId,
        })
    );
    $("#rob-money").remove();
});



// Give
$("#item-give").droppable({
    hoverClass: "button-hover",
    drop: function(event, ui) {
        setTimeout(function() {
            IsDragging = false;
        }, 300);
        fromData = ui.draggable.data("item");
        fromInventory = ui.draggable.parent().attr("data-inventory");
        amount = $("#item-amount").val();
        if (amount == 0) {
            amount = fromData.amount;
        }
        $.post(
            "https://qb-inventory/GiveItem",
            JSON.stringify({
                inventory: fromInventory,
                item: fromData,
                amount: parseInt(amount),
            })
        );
    },
});
