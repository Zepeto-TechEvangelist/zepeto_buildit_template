tell application "Finder"
    set desktopFolder to folder "Macintosh HD:Users:Mario:Desktop"
    set allFolders to every item of folder "APPLESCRIPT:Thumbnail" of desktopFolder
end tell

set adjustColorWindow to missing value
repeat with aFolder in allFolders
    set allImages to every item of aFolder
repeat with anImage in allImages
    delay 2.0
    tell application "Finder" to open anImage
    -- activate application "Preview"
    tell application "System Events"
        tell process "Preview"
            repeat until exists (1st window whose value of attribute "AXSubRole" is "AXStandardWindow")
                delay 1.0
            end repeat
            set documentWindow to (name of 1st window whose value of attribute "AXSubRole" is "AXStandardWindow")
            if adjustColorWindow is missing value then
                -- click menu item "Adjust Color..." of menu 1 of menu bar item "Tools" of menu bar 1
                -- keystroke "C" using {command down, option down}
                repeat until exists (1st window whose title starts with "Adjust Color")
                    delay 1.0
                end repeat
            end if
            set adjustColorWindow to (1st window whose title starts with "Adjust Color")
            tell adjustColorWindow

                -- click button "Auto Levels"
                -- get value of slider x
                -- slider 1: exposure (-2.0; 2.0)
                -- slider 2: contrast (-1.0; 1.0)
                -- slider 3: highlights (-1.0; -0.3)
                -- slider 4: shadows (0.0; 1.0)
                -- slider 5: saturation (0.0; 2.0)
                -- slider 6: temperature (3500.0; 6500.0)
                -- slider 7: hue (-150.0; 150.0)
                -- slider 8: eepia (0.0; 1.0)
                -- slider 9: sharpness (-1.0; 1.0)

                click button "Auto Levels"
                delay 0.5


            end tell
        end tell

        tell application "Preview" to close every window

    end tell
    end repeat
end repeat
tell application "System Events" to quit application "Preview"