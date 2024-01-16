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