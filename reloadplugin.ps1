$numberOfProject = 3

$wsh = New-Object -ComObject WScript.Shell

# Make sure Figma is open on the 3070 project, or edit accrodingly
$wsh.AppActivate('3070 - Figma')



for($i = 0; $i -lt $numberOfProject; $i++){
sleep 5

Add-Type -AssemblyName System.Windows.Forms

#Sending maj K key to relaod the plugin
[System.Windows.Forms.SendKeys]::SendWait('+K')
sleep 5

#Switching tab to another project
[System.Windows.Forms.SendKeys]::SendWait('^{TAB}')

}
sleep 2

#Because the loop end on the starting page of figma we have to change tab a last time
[System.Windows.Forms.SendKeys]::SendWait('^{TAB}')





#repeat 2 times
repeat
	tell application "Figma" to activate
	tell application "System Events"
		
		#Code to switch tab
		#key code 48 using control down
		delay 13
		#Code to restart plugin
		key code 35 using {command down, option down}
		delay 15
	end tell
	
	#Command + Option + P
end repeat

#To change a last time the tab to go to the first project
#tell application "System Events"
#key code 48 using control down
#delay 3


#end tell
