$numberOfProject = 3

$wsh = New-Object -ComObject WScript.Shell
$wsh.AppActivate('3070 - Figma')



for($i = 0; $i -lt $numberOfProject; $i++){
sleep 5

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('+K')
sleep 5

[System.Windows.Forms.SendKeys]::SendWait('^{TAB}')

}
sleep 2
[System.Windows.Forms.SendKeys]::SendWait('^{TAB}')