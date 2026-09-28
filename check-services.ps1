# Checks which AgriShield services are answering on their ports.
$ports = [ordered]@{
  'auth' = 5001; 'user' = 5002; 'marketplace' = 5003; 'deal' = 5004
  'contract' = 5005; 'notification' = 5006; 'blockchain' = 5007; 'ml' = 5008
  'socket' = 5009; 'chat' = 5010; 'translation' = 5011; 'frontend' = 5173
}
$expectedDown = @('blockchain', 'ml')   # not set up yet

Write-Host ""
foreach ($name in $ports.Keys) {
  $port = $ports[$name]
  $up = $false
  try {
    $c = New-Object Net.Sockets.TcpClient
    $wait = $c.BeginConnect('localhost', $port, $null, $null)
    $up = $wait.AsyncWaitHandle.WaitOne(800) -and $c.Connected
    $c.Close()
  } catch {}
  if ($up) {
    Write-Host ("  RUNNING   {0,-13} port {1}" -f $name, $port) -ForegroundColor Green
  } elseif ($expectedDown -contains $name) {
    Write-Host ("  not set up {0,-12} port {1}  (expected for now)" -f $name, $port) -ForegroundColor DarkGray
  } else {
    Write-Host ("  NOT UP    {0,-13} port {1}  <- check its window for the error" -f $name, $port) -ForegroundColor Red
  }
}
Write-Host ""