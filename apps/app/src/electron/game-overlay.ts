import { app, BrowserWindow, screen, shell } from "electron"
import { onIPCGameOverlayStartIntercept, onIPCGameOverlayStopIntercept } from '@/electron/events/main.ts'

const base64Img = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gKgSUNDX1BST0ZJTEUAAQEAAAKQbGNtcwQwAABtbnRyUkdCIFhZWiAH5AABABEAAQAmABFhY3NwQVBQTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWxjbXMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAtkZXNjAAABCAAAADhjcHJ0AAABQAAAAE53dHB0AAABkAAAABRjaGFkAAABpAAAACxyWFlaAAAB0AAAABRiWFlaAAAB5AAAABRnWFlaAAAB+AAAABRyVFJDAAACDAAAACBnVFJDAAACLAAAACBiVFJDAAACTAAAACBjaHJtAAACbAAAACRtbHVjAAAAAAAAAAEAAAAMZW5VUwAAABwAAAAcAHMAUgBHAEIAIABiAHUAaQBsAHQALQBpAG4AAG1sdWMAAAAAAAAAAQAAAAxlblVTAAAAMgAAABwATgBvACAAYwBvAHAAeQByAGkAZwBoAHQALAAgAHUAcwBlACAAZgByAGUAZQBsAHkAAAAAWFlaIAAAAAAAAPbWAAEAAAAA0y1zZjMyAAAAAAABDEoAAAXj///zKgAAB5sAAP2H///7ov///aMAAAPYAADAlFhZWiAAAAAAAABvlAAAOO4AAAOQWFlaIAAAAAAAACSdAAAPgwAAtr5YWVogAAAAAAAAYqUAALeQAAAY3nBhcmEAAAAAAAMAAAACZmYAAPKnAAANWQAAE9AAAApbcGFyYQAAAAAAAwAAAAJmZgAA8qcAAA1ZAAAT0AAACltwYXJhAAAAAAADAAAAAmZmAADypwAADVkAABPQAAAKW2Nocm0AAAAAAAMAAAAAo9cAAFR7AABMzQAAmZoAACZmAAAPXP/bAEMABQMEBAQDBQQEBAUFBQYHDAgHBwcHDwsLCQwRDxISEQ8RERMWHBcTFBoVEREYIRgaHR0fHx8TFyIkIh4kHB4fHv/bAEMBBQUFBwYHDggIDh4UERQeHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHv/CABEIAREBEQMBIgACEQEDEQH/xAAcAAAABwEBAAAAAAAAAAAAAAAAAQIDBAUGBwj/xAAaAQACAwEBAAAAAAAAAAAAAAACAwABBAUG/9oADAMBAAIQAxAAAAHpCamx5PUjza6TVvriygjXPN1zLVpfW4rpaKzRZu4Tm29jktDz8hpqZdlYMCMo3oCoZVbKrpdS2xeu5vq2uOgbWpqbisYWgsaK85fMhoiMXmlZXQNk/GjdAm6C1opylPPVj6pNtqS8SOdwGnz/AFd80A3HCOTVtLT6PMzuNxjfgstlxHgpE3YzTRDO2eb1eYsvmXT7PcD7UuKiQ7CPLh63FalGahjWtAvkWDU8B1iD4HW8KwncCxeqAotzbtM4mYFEG17vVUtTkuJXWke7etM/f4OcmsuI+cKxqzMH0cfTWRJ0EG95+TqyQhzq9B18jlNR5kUaqbOI2dXOC6lzfn8K+kxp83oF4FOpg+i8LL6dHA0+P1fPFaaO0hzuzvfcNUuGH0hVDoKu0Fc+o02R4MIMln6Mi/y5RfUObXOs6OLBO7OFqlELKDrciNKZMoVXdVTL12L0CeVwMpIkqVzLIV4USVTGqFrp+C6jNFfyzoPOOj37GSmTqc4pVvVVNtezebgqpK04lZPLzoSO6glJpqSUi6FnVlYdMXhdwfOMjBBCrNAnSzFwdxnug+q0OU3YZMa8hjEcwQxZ2E2lWQbXQQ5CMGMzcxfb6y7u2usGKLIWMONEyPKtcCNOq1v522pKfRISabokhN0EkmUenypEvrArLMsASspGiWkrzsy3r9YtqZq7G9FGJdDc0GtPo9CqLOkx8PF9CdecwGas2dKlnYIkIe1Lh0OjzOXVg23W0+hbSpu4SDTKCQi6CDRY23SOQ9AvNfAypCUrTZGw+0YR6DT881BeijB2x07ivoQ8rSlDmgRkchrJdgZmCAOpX0Vs5bW5DHsxLSm8nfQy4xdAkC6DLjcpSG1lRWVYIPZCq7QcaUmLIEpq6VjdZK05+cjYB2DEds5h0tEM2yzsfOOZVIVHU0ZAaPSDoI9givn55DqqqpWOT6Gyr4zMJ1LsG6cbSmQJs4NgwRputbtucdHFJGaqBMOTCOl2lZOauUMWNeadtKW4wICQS2mEnLWtpdi8bR2tx6NI3A3nb+LkdyFvo8dfV50vdFRUWZ6tUWHPU9EnWfPtLrDFeMvrMpCM1XSTj5Qw1ETM2TatrOotxuCLMUqepTaswIiozBCWa89alU1TaKF+VmZegLFMOTnNSAmiCAiMNATGAgmEEgoQMHdihVyrUp+I4rclElrf1d9Kxu5wucCgFWDTjacqSBCwGmNLZ5p1jlmmaDmr9LtU7ZVU9tNaLNAL7RfedOlY278kjI00mmWEmUNIM7sA6kx5jZ5y36efp3ItBQ1B1TB9Xq2XUDMx4RwV2rT7GLIggkXCssil8f1ejudo0XBPTXENCstKhPvHsGp4BboOhJs3V3C35r0rlaiIwowQFwGFXQyWvxjg5850er3qyFjsdYNwrE4y7QHlqJkZUUe/jGaMbKFtqeyIUbVstghhSLiOb2nPyPE+kojR85jtENk5Jd9U0AlyfqOO2GR5gFnMGFSBZLIBmtPXMG8CWtWdaIqRcbi1qsih1tKyguwts/Vc80OrXctvsc/FHi2CD0NrMl1CdfSckPVJOC2KqDJalWFJWXkGclhglLhCBC1v0DsSanIEuLpUdSmjtQOtuWmJzGb1IkNQ2nrkiIJOtN6etz+mnW2SvsmGYhTWfOZJKjUSShLCBIoJK44mPVnL00nUNaV2IS5HYExxCaW8lhgoiiz+W1jtcQ1DfmcjJIqCQUhghJ3ytdrs3prF+mCGa48/o0cqOl1lcCSTCUGzlrrpsYqxj+6qXhbO4mRVbCDQSbqshbp8yxNhpnIOZw1tlNWNxCoTUkyEyBIEhAFIAkSu5VwCPVkQGfTK04CeUGQAxsJAFgMCiUYFQ1AFSlgWBJAuJMAiXUgMTyFwDpc9mIBI2kCQiAkJIEpIAk//xAAuEAABBAEDAwMEAgIDAQAAAAABAAIDBAUREhMQICEGFDEVIjAyIyQzNCU1QUL/2gAIAQEAAQUC16SfyWdejPmYrMP3WK4+yYasidskCxsu+ElTv2thk5ItU8pp81ftGq3lNGjcxNvnjGjU4atVd2+qXaQGVchUwbKybHr286ozl9fcoXf2d4W4KP8AWyfFh/JO0aNUg0NR26KnJxzOcVdk/iqECtuCleFyt1bJpd5VT/kksycULiZJOso0fjXeIxvjLgjMEx+5bw5256pHRAqE/wA3QDbFk5NkMY1f0sBU3aStUcgdFf8A8MD/AOIvUjvG5b/7m9VYuGDNzKIdGDpYCrP2TweH2m8dhWDsbA3zqq7tFyKOTSxyKA8k0pWbk+2uPPR43NHhzTqInaC8dYWP+3cnHxqtf7WJi5bDzoLchmnHgBBP+ZBqxVH7m5oBlhsrQ6WMOTGrauTxyp8hB5VhRvM58ZR++zANI2/Lx5UzdH0naxMVz9HShjvcNRsLnKbI7XH1/bUsvNsrR+XKMdJPhPGjse/znY99DYVjo9IC7U6oh4RMgW+QLfIsXHxY64/ax53vA0EacPCnbq2q7ZMPmVoeHtYv40IoF7WssbQhNtyy03JYYNGhD4R+FYHmB2yaRnNSJWOkbx8bQeGJOcCn6FSBpVeAT25Ss3JtrwjWRRjwnDzpqHDR0Dt8bfLXyLct5XKVhZ/7FlxEP7SKMeervmYasPxjpN8d1vDa0JUO6OX6k5aMWyNcbFg645ZVm5N09YdB0eOlhv3UK1nX23EyVwdJ2UsiWJpDhJFG9GnEn1HhOa5vSQdHDR2If4zMX9nYti2OQ3rWVckgWKYY8bMdBafyWIRpGwfd0DC9QY9xENeKHpmpvPdQturuY9r29CpK0blNWe0KwPux7ttrJML6rY5SOB69stkoDdHqpBz2ZFlJOOq0akKMIDUwUnOEcbYx/wCHpcdvso92PuGB4II7JYmSC7Vc1jTskb90DrvgWHyLdYUsu+wZmhYVofJIs/J4rjV6qVJJGwwRxDp/4VOdsLjqT+DD3NO4LJUQW4x+6HhrxyL7VrDu3RLFQthoSLKSclyjDJIqtCOPud85I6Ukfwa6HHWPcV+0/EMQiORldFJ7py90VLZc5Y2UWbMitSccVGnLdkrQMrxdmnQhZs7aZR/Di7Pt7Pd8Pv7RBzwL3ECZE4r0xXPvJCrcRsCKNkUfeVn/APWKKP4cLZ5oO2RTR89YLRCXdB6fb/xTvKA07B3eof8ACehTvjq7x2Y2fguDtf8ArCVerWGWtllVWOmnYxsUXaOo6Feo/wDCUUU/4b8dHfDCj1xU3NS7HlRnzPJsZ969K1zJmj+S6xj4pYYVLHHuexmsrWoALQIoprCW9fT02kvY/wCWqMjTWJejG77XXValaoHuzr3NpGWROkei9yJcXXWcVzXri9DcsRmGx0xcNj3XWQ+EFETp9XuL0czbju4ddehWe/0CUUVB/seoY9tvrjmP95lsdJYswYVQUq0PbIfM3+Gm7krR+D9MrLBRGHEfhHWxGyaN2JqFHD1UcJAmYaFj71OO036NWX0eqoqFWNBrW9080UDLGdiCizbSb12L6fjGltEdGNEcXbrp2D5RPnXsP4srko6bLNiazJoghG/jikjFWs7khR7s7I6PGVZmzwJ7g0OylFrm5Ok4Mswy/my98U4HvfK8Dr6djbJRuVLEcsbdrEUe2/B7ipicpJjJcj6hrxMtXbNl4Qd9glka6lm7td2Ny9a4NfxHwMlYNq5gKbLdvJVa309ALCRcWPmQ6FHsfK1j16xbFzzYuzFQQX/y1j3l8cjEPB9P5Yyn8OYk4saFjbb6U+Syk91ixlQ2rDWhok/Zx0W5FHsyVRl2s6/lcVLiMc+5J6hg58V018ekoq/sLteGxBJoHscWvxFsXKX4PU79KiC0VOnLakoVI6kKH3SObqdid3XoY5Y4yOM6EeosfJUsrXxTt2acljOZCeLp6SsaSfg9QDks28CxyGAsqrgmNMMUcLFI5MGgdo1vI9OR6lyDk77m1H/YrEMU8WY9PzRue10Z647HWLr69Y47Ofgvs1yyPQ6BFxemtAQU0Zlr8rFVk5azuhU2qY46sPiQOY+OQPb0s1q9kS+nsc9D0zU3Q4PHRFjWsHqCPTIfgss1shw0dKwIyOK2EodLNyrVMN9t1fWrKxtnhe9Ho9uq4/LRp0dG5pbZITZGO7stGZJezcE0g9XMDlxBbGjsyubaxSSOe5s0ka3dMZaTu8owsK2yNW+cLmmXNMuScoRuc/rZ3ahV2FresrtjGv3sV+9WpMyeVsXU52ic9arVOboVRt7kfyAgns01QjYCOu5XnhtajejiiyGeJUr3Oc96J7JoAU6uUYnKrLvaUfwzythixMhlj7PCZZgL0XLVTTRwtyeU5XSyPlcTtTnI9tqUg8zkLCZO3WN4eD26rXpatwwNtSW8g7E3PbFjmvHSe7XhFq/NaPs7Uaiu3I02/acnyX+O3YdK5OOgce+3+3WtIQ4fcHBHtc0ODKtdrgAFdx8NlDF3IkKuWX0269RYmFqiiihC0WoaM3lDYI1TjtDij32/2PWH5i/U/s5H8A7gs3/1Z/Zv7SI/g//EACsRAAICAQQBAwMEAwEAAAAAAAABAhEDBBASITETQVEUICIjMkJxBUNSYf/aAAgBAwEBPwGPasSJeDTrsT7NZD+RA5d1s2cjRQ8zY3bImojUxsxYlNdn0cfkTIyG+UqMXUb2lHnCj9op/kcxyI9lenjURC8msj4ZX5GJHRG2rZRgXdlUktomqx8ZmHRTydpj/wAbk9mZdDkxx5Nmhxcp/wBE3b2Zmjyxk0YZ/ieptPwaaI/O+qipQNBfe2WHqRcSDemuNCzIUk/AyPao1f6fY9TL2PrMvyfT6uPVMwxzXWQ0serETyRh5Murk/2l2YIcILeaUumZMfB7RyNGPImzVYouf5eBabSx/icNP/yLVolP1crkRqGPsyar2gOTfkmzF3JbWWWTXJUNVvklapiaLRrMOGGBuvBgSXbM2d5P62skzSu8sfssbMsffeYmWZc+SceEmXs9maJ/rIsbExljGu9mZZcVZ9RkIy59lHE4lbadN5FRHosTLL2l5LGS8HIxrrdookjE+MkxaqB68Pkx5oqJ60R5Ldo5NljaOSZ7HpiW9FE4M40JCQlstpyrZIssjtVj8DbEJsg0yvt/92QuzgRFtJNIa62vaPa3bGdFi7OXE/Ij06YiOG1ZKPsVQ0cRRILrdsXYk7FD5L+Dy6RyyfBrdL/tgRI5Gizp+T0/g9NnpsraGHkrsn0zlRcn2NksnxtZi1MJGpwRX54xFFFFFbMt+x5OBLKkqQ5N/ZgxR4IlpoMzYvSkLd2cfcvahmTLfS+7B+xba4j9rFtk8ff/AP/EACcRAAICAQMFAAIDAQEAAAAAAAABAhEDEBIhBBMgMUEiUQUwMhRh/9oACAECAQE/AZx2umMfo/joXNyN3NnWw4U1pL1pQ1R/HY7k8j+DduzE/hmjsytFCtG9mZfkOJl4Ohjtw3pXcxuIuHRt4NokZnztMcO1iUREeGdbD1Ijyi9M3+3WmT8pm3ZjUT4Y3TOqhsyEupjHgXWQ+oXWQfpHSY+7mtk3b0kZY9zEYXxRL2b0WOVI6SG/MjI+dGdXtljsztP1ojper7Kaoh1sPpDLCfpjMb+E32pseds3G6Q5Oj+Nh7me2Tyxxr8jJ1jl/klJy9j1QhGPqpxOn6qMmddH8rFBmxnZJquDCu1gVmXrPkCUnLlkUP8ApWZzhtZTZtloqc+TqOoeV/8AmvT491kkV/REgrRsOpkq4XhR02NxXJnxbCiihFeCIOjuGedvSyOSK+Eeoh+iLT9HUTSjXm9Ioi6dneiTdvws6SXDJzcnzpell6xxuXo7clwS9+NcXpi3Rsfnhw3yyhuicaK8MFS/FmPFCPrSUYvhmXpq5XjBW6KqNIiqJv4NbnR2h6J1yRmpfOTFL5pLG7Phmhtl4Yf9G5DmNilTs/60TjT0WG1ZB7XWkcv7O6h5f0dRzT8Mbp6OaG7H+Ktm3H+zPjvnRZGhuxZGhZUb0b0TlemPApK7JKnSFolZDDXLGkUjuKSMkfqK8VHi9Vu+aJEMPHJGKj68FFUSQ42VrGhZU1VHaj8YoQXtndr0b1+jHHi/JeiYiXktIe/P/8QAPxAAAQIDBQQHBQUHBQAAAAAAAQACAxEhEBIgMVEiMEFhBBMyM1JxgSNCcpGhFECSseEVNGKio9HwU3OCwfH/2gAIAQEABj8CsZC4M2jhu+EKa8kHWXD7lk0H4IkHwOwXBk1edhFjT4aKdpbEaCOavdHffGhzXdRPwpt/tChsjv0paTY52pQFhCGoogdaWFMrgi/xCdk+DU5+gVeOeAp8PWqc3lbM8FMUK9xEWdI87WjknnkhbeV3Wwa5L1QGA/DYGntZlCCDzKngBTXWPZKUjSwMFs7I3OtjW5zNbAzUom0hT0QdqpW52n4Vf92HX14Kac7UqWA2NcmxJUe36oTCvkiS2aDVe8hJcU14nMUWaiRjkKClhHhovPB5q74bS2YXC17q1TIbu2av81d4uU7J4CEWeqbEAqx2c+H+SXFF7zPwztzWa4LshQpym8XzI6/oiUXalAYJ6IaGlgnkuyFWG35Krfqux9U2LWUOsufCwjg2mOaaVEhSmS2nnwVEYTzKtJrtBdgIVQyQoFChamthHiohjDlLC5pOYTy3MDdNOqiQ5SkaDlwWRQiGsl3Y+ayC7K4hPj1N0SE7AzRE4ppw6lwHOiL4kQABOcNcNyPVviUxULaY08MlSbVskOW0CMBCLdChEAo8WUsz+qzKzUKcrzxfPr+lj380MEmtJ8gpxTd5BbDa62CCPXHI1hnMK80zGCgunkqbQsmpeIJrmhs2niV2m/8AFs1nF+gWX9RTMGnxqkKIZclDhdXFF41pwse7lLBIK9EN0aK6wSGB7ue4uu7s58lMYdoeqJG00Jr9CnACZlRdtezZEf5Bfu8b8KaDK7opXQnRrg2aCljIetbZ9hvNbLfXC93LdfZ4h+E4+sgtkeLQmeS2YTGu5Q12HfT+6y+qn9kr/uKvRP6iZdZcv7ZE552O5UR6thcpxZRHfTHE8t1RB3vCjsZuCk5yTZQbwcM70l+7/wA67j+dAtDGeQmocAwWzccxY5x4CacZ3WcXSQhwxQbg8zuxPsOo7cXy0EN1XYZ8l2GfJSIy1USKQNhv5/4bBBqATtEcAhDhtDWjIblvN28uOO2zFNPhailt5hyUN5DgYm1XeM89xPAx/A0O4idXCBZOYrJdz9UyCwyMQ3PmmwmCTWiQG8hfFvWHiKHGBcLry7opt4D2ILnBw9Pz3u2Misgshjc4e7ngfBPvVGOtnSo73Oc9rWtmTwP/AJvTdMqrtFZrNBPZwwdW7sxAWlPhH3TbDithukDXHSRPNdzA/D+qixDDkXxc5ZiQ/Xeu8xgZ8SETg4YIRDXZ6IRIMq5qcaL6BbMMT1OJ/wAKhP1aLO1E+a6Mx2d298670seJtK7Lvmve+a7x6DusdQzQD500Wb17/wA1SEPVUEsV6K8NCIhQy5DrIUk58JwN7ZCgg+G1sMTk0S+93W3XRdJ5K/FdO3rLpuTkhFnJkppsTxV3ER7DJzSD9UyK00cJ2TcQFI9JhzHCa79q9nFY7yO+pWI7shF8QkuOCKx4m0uUPorXEwXmYQboJbiJC8Qkj0PpYPVtOlQgOjHrXEZ6IuiRXGfCdLZtiOb5FbbzGbo4qU7j/Cd4+JOmTfJSiVYwTIUT2bWhraSFrKVdVM89wGupeysg3B7X3pL7XE2BOQB44NlpPkFtw3N8wphDo3SDt+6dd1GdqJWdawT4ELqyAyHoONgb7oq5ADIJo3BhOocwdCuqeS9o8VQv2h04CZ7LFEa0VFRg6wSMSe0nsitEpJwGU0HDMVTYvvZO3LIersAZDHmVcbnxNhd6bn2jA4cwhLRSOSLmt9k87MuFt/o8UsXVviAD+EStidHORruejQtXVQMB9zku8hqceIXcgrkJgaOVl1uaki92QEyu/ifjxkK4cxYYcZgc0oxOi7bNOIV17S08xgkxhlxKhwi6e56IdMFVJtBrbEhiU3NIWR+aY/iRXH1jPVTFvtoQejIRGeTl3sSSmIN74jNSaAF0aK3MmR3MKJ4Vms1stW0Z2gR4oaTwlNEwHRITYda8Su10X8B/uurd3bvpuL0My5KURpCocUGQycMOaphywGF0M7U6xOHoi4kknMlG5Ec2ecjb1ER3wf23OUlsvPquBXdru12QFeecHKyuAlBw42TjPrwaMyiweyg+HGIUU7XA672WKgGF5JV2O66BxKMPoIIP+oR+QRfFe57zxJnjoslcd2h9d2XuyCdEPE4rgeJ4L0R4aFdhDZU3Ek7iluW6m54noM17NrhDCMCPQfkptINu1EBOgXVwgQ08OKvXCpEE+YVIE/RF7y2AwZmSq4nz+7SKvCE2eslRXuy/UL2PSP8ApfvH1XtemOl5zXtHuefkpQ2BtpJIAGZXUwZiCP5vuI+4xvT895//xAAnEAACAQMDAwQDAQAAAAAAAAAAAREhMUEQUWEgcYGRobHwwdHh8f/aAAgBAQABPyGY2cMu+8Dkxvkac6ECbIeUr3GQNu0Zs9nsNlMY2WcuMCBrpVXA6xtob7scncsXWR2ydafZiZWYwcpO+SsX7SoaOSCxvMwZwXuN5Gw4Y3W5J53Q6jzZ+x/tC+yuzfkjNiZ7YeVi3iLRjYhYqHs9saQbrRSrnImyEKp5E8IZc4EhsHvkFOSC5iIeEPiSnqhN84FsQkDVadC1lK3hDwUHmaK5wL3ZgFQqlhVfnPqRIRtsVSgTgTySOYzTZ5K62o7kF1sivHRfcao15pqqPWpwIjcpuRruOtLZjrueq/sEC+wULm/S8xqHGg1KpNezGojp4jYTjHsKrhKo1j7jHX3OxE3sO8gU1RIJdykcMjGfYvFDP9aO1NHoozUt2EqLJI1ohO6HKE2b0pbiO5GfYombj6efAtjOiRdLa7CQJgSWJCgWJkc0qNWIfgnEyJul/aCUCJIzyAa1RzlUjuN85JQWjtVUwxui9olM+53h8L5IXIUdEFQyElSLgIkqUqJJnX4DwyHbIySBoz6hOGiazGmIT2wh0wgvZYvi1NiSR4fGRJNo9Ql2rlzcBzuvsDU+Q2Vcp5JhIuEaYGwkt2Ik06TKG19BsQ16Rqv6hAkT2gPgIbuiVRra8xxIJWSYRUtIVQ8goFUfmJ/nUmwN64/ITLe6JXDLXT1Xr4HuQI8L8/eCDQkiRDRJhpRbyqdJh+SOpZGYor7hDsfoNc6rcj5mdq6VBEjruVXcMfiEMHFs6wqv2KhCLqEMIIDBCHSPI1y2N1rMSbcSjmRZEnLOwNllVJlrvBWs5y9JJdCwZbiogqPYLR1WtNVfYYROiF3t9FNh8A4/IKtYCTV3ae8fIxE7os+p8OJCQoIMhFCCjcYahcb/ACSq1NFIpiE5D1lpym0x8mvFku4ivTLNFx2KnV6n4Of7Kh7Ix/HdFpQkiaaIQffsqoVS7y1/IEu7JTCexxP0MicR/sEQ0LwE73L4Ei+CrV6ex3RUkECRWp9wSoTuP1sKKKya78kDpNQ1Ol9Msmx2OUKaTLNaomoaTTEH0HAwQ7Cr6aQpu0INzbxyST7cwSh+d+TJlVnlPx+Se8tg1DKT8lbzSDRRWVUFGTnsOV6rQ7sgFuJFDMMgG2+BYaZhf+EVIRt0OibZz9R0GPSRXbP+oTITT56GUtt4yQrN1FqpcnAwI15aucCqIxwyQoN52f7IUrtdtFEFoh0JZNzvD7fI9SmXdIquFotN3Ev2RRVOWuMyQUqW8o7GSPUxvRsY2TFQfZdDGtDksiyv25JJ2elBxq1Z/mglJ3PIdz0fsyPyEl3wHUhlgPwVfEDUkk80pi2Qey8ixK5Co8Z86QQJVMFwU63sHoejJHoxMhtDFvnjOd9WPRJiNiJ+x7cDUZ31LwTXb77HI++xBA7J9UoxUpVa7vag1BWTQS2A5fKuy3ZBUzZb3ekEECaSKFRjEosp6jGPVkjZI3+lPgVVOr0QiRZ/MLJ/0X8poRJSAtGsam8tRrwtEmHvZH8FCBhBBAiBIVzBcPCqhRoYY2MZI9bvKLnKx0PRKoIhFN8849xDsKNdyeCKWo6SKOi8NJPyTaEKSEtUIRormBosTAeh4kTKGNjNhMjZI6Yh3jZUtHohJYqQXdvYUOsROLHC9ImanRt0qivBDaedZJQiNM6LoJohOTl8CN4JIaukwkkrElH0JJdLzoY9Y1BAHoKgqEfznidm1FN0yeiEQiEQtiEJIhELoosaQ0IOESf5BbUvUsoQnKhDkERAWpv7JguPSeVE8iHq6IaRQx3bOT3I6isio2/iNjbJe5IU1yW4zclksTnRjjY0PkauTDvJlwlE22OVSqGvKklNxt7kirL/AIX7md5S5J0XuNzUUzokQQBvL0oNGBRNCb5P9EKoEw8GqCuUn6pH0yMJ6KrRi82+TQbRc7IQEqPRkjLuSWWFHUr2JyOE+X4YlFII0kkCQ/l8EoNS8+8FAf4b9H4OlN/kPWSdExMkapgbqZWwRgovWah2yBV3tVXA39MWHvXnTLv3vUKIX2IY9EQd/XMb7TtuBDNllMcbfIyy8BEUkeKyKzeFTR9DS5oTJJGgTQqNDY2SMNj1Y9YJwt2+YNjbvGFoQd5gYkXNbtsi6ShDs7EaWT0VMwU4SCjzXQRDgcsZ1wE5S+44kRTnOjY2SPSRsb1goZaSe446sttjYmHBBAllEQ1wWZ/X57CFVlegjruY9ClcT6bCGFGSw+vuCBqjPQTZQfcaVyBVy/sIj1ej6HqSTBV+APKVyIFltsygjYSESXwVTIkujph6vvnls+C6JkmSdDGCD6g3JHkkZyJswR++Q9yPRQMaaJU+X7GJyPofRVhTD80FoQxTXKRuya93MSFZWQ4EFJUEVc+dNLWY9HHuw7oGC3BW3DuKl0YrcsrErhKpwImY1L9WLbDil2q8CWJNAzeHwJBbTlfsfVAkRI87XYSEEKVHLZCStNvOyDiCoHBIQYx6xNeYORklgK2uWUF1JWT0FVgQPDc7qJT9SdGXcpk6TUVn36o1RL4k4bI8myyoS6wdxE8Y/cTEPhNHtz8nsJgDPyHmRg/3QtNLGxaEvIqaZJpGHS6kZMS2zkMc4NURDVuqiNxAmLrpQhCRP8RcLQx0SyH0LAtotDxUTZtLUaYc8l4DORIGWkVhKDJgs+JuTY0kjEVacEolvtURlJsZWQkhjdkiI168YFboQkJCGomrk/JBuHrpCiu7sTEsCQJC36ypGjwiPw6mSeCiwu9dtDdZUmVbyE0MXgUiAMkPblRjme74LbsknoQym3uykwtbEN09RBMGIReBZmzBQYhIqALCBP8AZ39Nx8IpYq2JE3c1Or5kf5fH+CQMY9WIndIryZuCIZszhuvqfSx23fC5XbIWqxNSEbw5EPJiEhI41QpgogkXBu78W3JCCxS5mN3n4EhjyPSpTWieJH+x8/Iox6SSST0tCNSr9MEhonEoQRKQxCCUEbFuSiVH9R8v0LjRJz1GPJJ0V9QIBZ3D0paVv9TqT0SSSSNnS3OhGkITRSxrYpiSVfQbMZVpuzFBaVfnQrSUhOuSbI3TEGErLGZSIJwKOuKMZJOpI3csgyKySihlkXgLK69npKSltImXch8G1mi4aC9OUaaO3/kHk85fD+jS080kVfcTEr5JcjfU9YxkikPVG40N6ogC47lfHyqEEIkuESjL71RhT7SxYt/Bk+An7JK+CeMOWiXZeg0LFLHZDU9hXnu+OPqkYiBOudFulsnSsHbS2WD53wX9BC0Wl2jHotHsvhLhaLtL6GPT/9oADAMBAAIAAwAAABBuGsrTfr94SzWdYJesGwIP/wAxvqX4EUpDoqF/RrGqk3xXYHNIH7YHFDG1jfRHxII3q1GGcrbPPGI6tOCfi1SvtALzNwr6sX8kzLTp/GDQU4MNDmew1BZ98SA6hIKPCPUtJxybkbygHImbp/kOH2BsfUYCHsAO2aTiUNEf44Pi6snPE7DQzbH+8tRtkhzR1M8rAAYU7NZLPawWG6+Xe6UOGl7D1snSAJmEb6Bd1dK49BwzpjoLjORlyo5sMgjMBHHHPNNZhLOocJXJSNRBGjCH1EIoANZ70ocMdN/+xMdCVVQ5DkIY49/8ii8+fgchggec8c98/8QAJxEBAQEAAgIBAgcBAQEAAAAAAQARITEQQVFhcSCBkaGxwdHw4fH/2gAIAQMBAT8QQA93ctkna+C7FqBkPcay+PAGPhl8Lg+9sM/Vt57hO21XtfWQBkGWQI7fKC03KpuwfE1nIruM9+/vC4zj/JnGGES24HYx9VooTA4njlsPpiMgfveq/wDfrIRYff8AyzF65f5b7BC2i5tiCjaglm7dC5wLMbQeyzAnH9+NE9wSa33M7u2Q4uRGlBuNr3hf9ieuvtv9ROafA2CVydiNdxgw/e2tXWAn0tlh8ZM/Xj2e2IeIADV3+tzYP5vov0hq5P6josLpKfySGrW6rhflIZjGHskWMMkpejqUc+EDgRxne9H35sjol869CWbvlgH5tttnwNuNsMNJDjwEaDfz/O64TO2ewP5v8Pmamz44uRtzMsERxcpF1l9L9mwl38y/mVncv5kyFVnMk4uzsuCZg4lj2mLiPOx9f1sSQWeBuWRO9En/AOS//hgAvM+huAJ7EwXbJlGDeVm4oLJ43NwuHxCHJ+AQIS3WO515bZyGnkCFwLZo7LrJngDmVx4b4QRbLnLbrqN93DmCALVzIQWyHR/aR18QwNHYedlgx5OQw/KwQVhc3HiVu4cjDmtRcpYwrtv5g7bDHhfByZKwEhysnJnSV2Ob/i2uh12f3/stNiMJS7J0JL2svBgPAmoRAdJS0gOniEObbiCnJagOXJ30ez4+p9I7EB5PhJK4U1Iw9m7/AEzr+BuhAcE+R1MYy2+CUOHmV7LNi8Pd9Kfh3xC7l3PtEeHzN2/b8L4//8QAJxEBAQEAAQMCBQUBAAAAAAAAAQARIRAxQVFxIGGhwfAwgZGx0fH/2gAIAQIBAT8QV/FLxPE24eD++i19ghYd9jDRLIreMHZ72wrkZ6Ybv8w/Euz0ldSbcAWt6/8AnRKH56Q5U6z87jDbgXqf594yxu0+3+TxZmljDsOLmfAe0ZvxBOFtxOzzG6FbyiYxPz95i7Ry/a34Mu7bQPOfUtI4Jb5ViBG5Z45/i0zFwYAaCfjYCuenF2EDa/PPtK7U+t2Sfz0jpcTMvnEdh1jOViN7fdh5LYLLaDh9ZLXrc3bLLhLSWdrg909GAjw2I9R/V4R0lPFsz4gBw41/ew3+T/JLXW32GEFlkEHUchK6nZ+0E06S4a2VrjefaxhwOx/tkFgmA9GWWQSdCeNxG3usbgXv1CFIXykS9BynEObg2WQQ5nV7LKLYJ4nNZ2UF2N1ys8wTzzBd3II88QXksnotlLehGJMVmKurtx0K3bVsu1IYIuCCw9J6rBB2ycGD56Z0yyL5egHBZNj5736GYkiej9ITyfWYfCIvZnjv8GB6ukGHPSZot9SIERpjyyAVdEaGTstg6EFxOw0Hiw5eupmG8x5m59D5JDjlE+MS18iIguQtPMDtKuY8NxfiLtskfhbN6Q7vD+b5sWA6GVCdNLhG95XhF/RkGJ0nQY1hmWWdEVCJgyBM8FpmCYPg8LZdruCcWWWPLaTglORuQ09oBw8S8c0Af0F5dD8B0F2fcvHxf//EACcQAQACAgEDBAMBAQEBAAAAAAEAESExQRBRcWGBkaGxwfDR8eEg/9oACAEBAAE/EASI7lFc1fjUP7vFVeYu4QeGWPTX30Kp/wD0g/VS2Of0SxTeRH4215twlLA5JcYYB990tXVJwBUM0QD0BdI5OaDV+kuQKvI/EB0GCdxlyJR75P30wBieoz833dalZdOnzy/GCLa3k/rpcPCIpHZL03X+T6YgGa77BxrzU4kEVE4kdDqlF0gtJklaqsGClGMAW3Onefxf6hJhRlmularZtdtwckDpNLwH+nSF7hXAtp3xl/JK9GyYa/ox9KnpYF+ZQiaYrvD9RxWC3tr6mJHN9VXdegaWbXzS6YXXzjD5b+WAgTsCz5gUmBnB33Yo/cYIbsDL1NNjwvtXM1Ssh3eD3YxtPbzlmOIVz0rxpye8Dgj58H8/U3qtXDDP2DpafGcXuztq4L0vR0+SfyX+x9ISvKxxn37RQRu9L9PQ1mQFYjRFyE9LqUJRQ82D7Z21u3wZ65y5w/qXdSseGpRLswC2yoVdvfcenkh8x+3FSxqCfSYZxDguT+Sa6f8AR042mCsMNXzOZr49D9zA/oPBK4l9utS77GXgeGXTQ1+I/UzfhqOfYxU8528j175jTyDRKGVFvlXcMuoK74l/+0Z+6v2QIiwalPV0Cr+YqKBoFMMc5Y4Pr2i0u85IWP8AHdJa3hXuwzCjO8qY8kw6FfiaiePeAbTT4SX/AJUmqAL7ilvKOst0YZoL9FSbT0estMI7Hkau5WuQr2Dc7AQe2gfEHRBUYw5lOOJ51Kl2FntNTs4/Ph97lSIam2rheKXGve4pAJt7F5cStkswd+STwT+I/wAhTMY0r9zl0+/wxgiUit3YriMdv96SqhbLDmXAhSGa483WZVC+5yysWxZX5mDboxXhPebbLHlK2YZpn2KZSEG/kH9zUfEjBMrxB+4uW/tJlfBPW2TYi8EYBdU5cwKmav5P17y9ta+Xo5XtCW1cTzG7IyhH8af1ElA1Ur2xZd9pTxcrPIo3pOwEA5xxgjtfXTgNsVFba+4nzdIcr6yLlFyIuW+kpQxY721MnvgZmyuP3bhdtBDX2Q37mZSK05fgwsC+119w45mIDkKZ9ec+kyNj3JY9W4Dv4gPyEJr1X/Bn8A/cspAJaIyc6cDWqZlrDXGWHVm3zFp7cvlliiGXZ0vlzKrDKjcKfaWTT4/Bj9ybIGyzgba74iBYrOItYeAMcDlbv5ijYtECrV0exP4H/YfQmvZMFtR+JykNX4S1UYpAzIuMBf8AdS5MwwMHw5fonYAbfabXMi8zLERyEuoVEnhX4g8dPfJQexjzxOBGVy1jp4wVC6iZHRe30PxcwNxDsSQyt2+esyDjpUqX/rmYHvDGUG5Ytml8mH7lZGYLDkMuUevfMMuldW4/OY7IS1a1CZXzP+g/yMSbrCvtiXtAHspU4WdbchoCms186Rm7jrz/AID7m98JdRKUcTCXB7Zeag4YPklUXm++awvXGudykxsm/Kql7fgZ55z33O+VfQDMsiYSBEWNn7x678wex3nCMv1liyDsbG+GFbAVq884L9w+kBp3Xxdn3Lz20NTW6dPtAmKeMRoVpxGZ4UjL7sPH/EoGpr7M4vFdmve5cto9oFmPW3QHfb1/1BNfEIdy+5eitKT1HSUoYsd7by4TEzob2sH0Sic5PeUF8ZhaV7i7Sd0irvRMcb4+UzkOHF2dpW6hWdru+xoaKL4j6IfytPeD9xIaicxIkUgu8/u3+E5mSa+sxwdFZmpHIjxGjYacDVeivFeZ5rr0n5drlSk9D7JkekPcz+poLuw1PK77P7lAp7fehXxA/M9/glJH/S/7DXsjX/YjBmKk+wN0wGCUwyzcawFN9gXEqGUpR/RCKftBBANBUuX2Q4lgAsq6AhKQs7293jg1T2aYWG26LbXlW194cvCBtldQIrelPEwfUWC8x6FxFjFgyUN+D994AO1iWEeRlTiI1uGUgSUGNnPvpx6RewJSwi2gdrzrHEUTmPgcxHwStUgvbG6hFQ7bvolNwLWL1fa8z+q/UI0i/IibOfeAezZr4lTqOXzLgQUhmvna53LPjMH5+pWvTcC2Z3zI2yljgs1mwzi5UCVrIert9auii+IO0BrDTXEa8sCm+1giDOsUWsR89Ja6TrpBm+5uPX6dvjtNzUrEHSwYBUNAE5JruDfGd2vtD8/+EY2RvSrOCDTW/SYGj3APhD9SomoLgKHi+JdtHl/yVOQjbBoGalAqznbnRU1q/Z393B5C0pgaXKoLpq3MXAafSaQWMlyO1AwCsQTz0NXzAkX5pSkurytH3McMRHFjjDivRXk2xOEmvFekfsZjqGoIYGZfRYUhDTd+jlXHjBYFQA5FJVnBWfXzDIMeM/8AIxbmyxs2Gze1BvmYlRIhS1q1gqZbrvQ01miJD2JeFmnL5os2W5KMuwalc2zyk5X/AMKAIEIvC+pU+ZaG9+AD6U3+QgtuCHmVji3FqOPRLWinoDr3MvpcZQyOTowyqYeJdezmEOTaCYmL70MQ2D+D0n/Af5Fl/kOBTqKzl3hxj2S2OayLMzGZDYlhlV4tQG93SDOHSUQ/KrlXK5cwQ3CDmEVQMVIVS48APq/1BwjucBGkbccbNqji5lyxxpzH29a0+0qVExN4SsUQSMLQBy1M0Af9g7lICrg3fuux3rh7RCY99C0KMFbvLSTvY9MiswgzLNQcCpohwmRmLuW/B/7FylZUZfdkM2PpExw5iRZ0nKfJQjib8NPtKWGmJHUd9JegJSVzAxXQiAKMhl5VeJ/MfuMXbcXI2BckvDKke8muC21oDbCvl3GMA3C3N+vOwl5ZAAcA+/8A4mqizTGl5jLT6RUbahtIo7XRWYNamcb6gfe4s9AXAqYlKmbrQeLRh88eJ/1H+QFpKpYjAhxddVV3YSi5ljM5PThfHoS5CHodOOj8tYOHX7n3MiUIgK4FhEHJlzCuIGU8y+0A8zJ8pFpZ0M4mrew/JXxHiECV6HKllz1z003Euh3Eu1bpziNLEZMu+gLoa5j1Id6HHEQFs2RRnhG7ZM5ab+SBGgHdlQKo+gftGJuMKlzT3YLXsCbofQAcPuRi1aMrKXKYRfG3osc9Ii2IWcBzDeSBtp6wsCBQXbTXZ6Tz1x3TlKWqTKFO7ii8y+g5hlKpbLqUGpxctaOJZJ/6hOSGtxl3F5z+EYdX5vuhX4Ipdx10INKFUVncpwM+qkAH1gEpP5WwQXD+RhAFA0EICNCYInElLfuluhpNWF/cSg6I8RCvM3QRsEQqnDHFi1GCB6VPTcZe/pMiYR44tNwNyfRwb88n5Pxg3eACm15nmmiQO5NWVUVCV9Z9yknOCPxFMughDAQ1ufBtlNNEri+u8fcPqKm8HrUKSaW1FON4JrB/aWTVUvHxOtVABaAujOIsUWXBhwktovv0y/Q4eZaXPPG3TujTqavoscdyoEKRWZf3lY40sHA9ghGWFQxXLQC+NkKKTbgI154qNjivfJ9K6ijaLLuDN/8AJCkEK7694jRYNZMy2yUtsuyCveKULOz24YWKJexGnIMDK1wtY6FcYUXljTrTlgQixUNwlerDgj0U25Vj66vPEJJVSNXt5J/cTH3YYDeRejJMY5DwK6ijF6XCTfjCmGBSIDZybM5XiXJlYNlmRpv0hly5kKPFMRK+YXDFTWEXCpBjYs5FegLgwZNwPZAMW1zHcuLHPPQ6lQILOgCr6EeyFj2wHzv3nqKCStB47xYzgiYVSjvXSQR1BSpUNqXH1k8wUOQa+GANy+spcWavuVRTg9/SLzQtLewyKzrN5ZYKcZAK+yodkrZ8bLz2aET4CYn+gMhEojWJ3nBTeGD5JzorxFix6KgQgUA+/l4vWlYtblHBeNXD+pnxd5iHc/ASuU5lF3Qd5py8QiyAmADBGbJv8BlCjpavQooss7ApdgIo+8w6Wzy3gWesS+yXQWZNmkmtzz3NvsXMlcRtkMP0jkKBQrtRnWIVdTwdjNHQeI0StPK9kbIhqD15it+xEVFnr0SBDouM+7oD++v3YlHddiPKsysm5v8AKUC4e33w7hM6VTN5pFFlyrgzQL7OyGtSANBUvkUh5HDLj7qYcr52RUBox2npH0vdbyQJGhwozzax9Qs27ejGQS3dMUe0Mkcxx03CAgRRWBD2Bf5g9kzNabHeWEqA82+DH+Sts+mfO3x8zsAGnzy+8SZXFr4wXwTPCoTQLWi3RP7v9y60GekguO5anf04UiSwyp9kWBsWv/HUbMbeAdg5I3wwRPylNxjeI3U5hhe7+JXPYTpYIVLol1LuEEMPQyyMpeQv/SHFwIdFaAi/kBc+JQszt5WCJGLbgSFq2rc4n/KRF6CkFnCoxSinpKnTk5auBkMszeMeyhPO5ORlwpBtZZ3u3ZJaG9yh7FhJFVr/ACV+IUq+dG/CQwNgYRRqBXRsXRAfbHYWbmoZgx1oQ5g8qUr8RiAwRiar2Mx9AJ3Lm64gmiWRDrcZDVoyC6XdNaY64FVjqFESNKLU4CxJlPlwryhvs0DeDdlNk5OYaYMQHNpSwmMIBK3K4y3ogB7I8r7m4XtAPMYuXFisWq7AL+IQIyzaVcPzANheSCoYCG5qFcqB/nOYAx1xuXoUJWC2WbFFUbWBwY0CptVcqu2BWMQQfWkuViwENqjj+r4UfF6RlmCGEidWFQes8gDiwy07GU5X0f3BGV4/8Rqsr/PScpHu/Mw/zcOw6BDeyPeLUIoRdwnaHpVSg92TEgCV69LgcsISpY04OSGKu6IJYNs48rrHLNYFGLLmmy93opmXiLUlEBwr8OT6P5boxx01ikQRmveVeYsuXLaiCWp2ucwYZgRyiPWECBzKYQ6QjU056eXARmcl1KC6Da1oMyliOMtC3ScJVZaUo0lJY7pKKLSrQB4jvZHUWLLl7QmaF+OJcG7xK5QRU1Obfl333q8TFS4svor3j0RNrfC56DR4LqDcOkRGtBzMDou54hRTUA1FJ2/QQvgj7pt8Xg7+cHrGL1q9HNBoC9GCP7T2jqFWLF64lK3ELljjK7wigbuyWN+HeV7lYowmPQ9cpBGrC9pm2CqF627fETEbF08GHZIRu3AjXJ7sVcAZD9q95ailGXypGeFZvNPNT0NMih538yuGHWn+95VrAAB6WKXQGVwZh2XlsX1d/HEtMZcZb+0RZi6LF63Ee10WMwZqEY1mEbMpAXt4iTfSWNwx2w+yPwx0k10n5OZ6aboIn7IV+GnzuLk2cEHxk+o7HHcT9DMGxbQvoJVbQxh8Z/MrsXbUvl5mGNwsesNUSSAi1V0BM50PIg47Acnuc0Rk3bMgj2lyyyLFj/8AE3+HqXHVD+z1dQQ6hr/4J1n/AOSqPov4m2b9D/8AT//Z'
const OverlayImport = import("@packages/electron-game-overlay")

app.disableHardwareAcceleration()

class GameOverlay {
    public placeholderImage = base64Img
    private windows: Map<string, Electron.BrowserWindow>
    private markQuit = false

    private Overlay: any = null
    private scaleFactor = 1.0

    constructor() {
        this.windows = new Map()
        OverlayImport.then((Overlay) => {
            this.Overlay = Overlay.default
            this.start()
            console.log(this.Overlay)
        })
    }

    public getWindow(window: string) {
        return this.windows.get(window) || null
    }

    public startOverlay() {
        console.log(`starting overlay...`)
        this.Overlay!.start()
        this.Overlay!.setHotkeys([
            {
                name: "overlay.hotkey.toggleInputIntercept",
                keyCode: 113,
                modifiers: { ctrl: true },
            },
        ])

        this.Overlay!.setEventCallback((event: string, payload: any) => {
            if (event === "game.input") {
                const window = BrowserWindow.fromId(payload.windowId)
                if (window) {
                    const intpuEvent = this.Overlay!.translateInputEvent(payload)
                    if (intpuEvent) {
                        if ("x" in intpuEvent)
                            intpuEvent["x"] = Math.round(intpuEvent["x"] / this.scaleFactor)
                        if ("y" in intpuEvent)
                            intpuEvent["y"] = Math.round(intpuEvent["y"] / this.scaleFactor)
                        window.webContents.sendInputEvent(intpuEvent)
                    }
                }
            }
            if (event === 'game.input.intercept') {
                const focusWin = this.windows.get('messenger-game-overlay')
                if (focusWin) {
                    focusWin.blurWebView()
                    focusWin.focusOnWebView()
                }
            }
        })
    }

    public addOverlayWindow(
        name: string,
        window: Electron.BrowserWindow,
        dragBorder: number = 0,
        captionHeight: number = 0,
        transparent: boolean = false,
    ) {
        const display = screen.getDisplayNearestPoint(
            screen.getCursorScreenPoint(),
        )

        this.Overlay!.addWindow(window.id, {
            name,
            transparent,
            resizable: window.isResizable(),
            maxWidth: window.isResizable()
                ? display.bounds.width
                : window.getBounds().width,
            maxHeight: window.isResizable()
                ? display.bounds.height
                : window.getBounds().height,
            minWidth: window.isResizable() ? 100 : window.getBounds().width,
            minHeight: window.isResizable() ? 100 : window.getBounds().height,
            nativeHandle: window.getNativeWindowHandle().readUInt32LE(0),
            rect: {
                x: window.getBounds().x,
                y: window.getBounds().y,
                width: Math.floor(window.getBounds().width * this.scaleFactor),
                height: Math.floor(window.getBounds().height * this.scaleFactor),
            },
            caption: {
                left: Math.floor(dragBorder * this.scaleFactor),
                right: Math.floor(dragBorder * this.scaleFactor),
                top: Math.floor(dragBorder * this.scaleFactor),
                height: Math.floor(captionHeight * this.scaleFactor),
            },
            dragBorderWidth: Math.floor(dragBorder),
        })

        window.webContents.on(
            "paint",
            (_, __, image: Electron.NativeImage) => {
                if (this.markQuit) {
                    return
                }
                this.Overlay!.sendFrameBuffer(
                    window.id,
                    image.getBitmap(),
                    image.getSize().width,
                    image.getSize().height,
                )
            },
        )

        window.on("ready-to-show", () => {
            window.focusOnWebView()
        })

        window.on("resize", () => {
            console.log(`${ name } resizing`)
            this.Overlay!.sendWindowBounds(window.id, {
                rect: {
                    x: window.getBounds().x,
                    y: window.getBounds().y,
                    width: Math.floor(window.getBounds().width * this.scaleFactor),
                    height: Math.floor(window.getBounds().height * this.scaleFactor),
                },
            })
        })

        const windowId = window.id
        window.on("closed", () => {
            this.Overlay!.closeWindow(windowId)
        })

        window.webContents.on("cursor-changed", (_, type) => {
            let cursor
            switch (type) {
                case "default":
                    cursor = "IDC_ARROW"
                    break
                case "pointer":
                    cursor = "IDC_HAND"
                    break
                case "crosshair":
                    cursor = "IDC_CROSS"
                    break
                case "text":
                    cursor = "IDC_IBEAM"
                    break
                case "wait":
                    cursor = "IDC_WAIT"
                    break
                case "help":
                    cursor = "IDC_HELP"
                    break
                case "move":
                    cursor = "IDC_SIZEALL"
                    break
                case "nwse-resize":
                    cursor = "IDC_SIZENWSE"
                    break
                case "nesw-resize":
                    cursor = "IDC_SIZENESW"
                    break
                case "ns-resize":
                    cursor = "IDC_SIZENS"
                    break
                case "ew-resize":
                    cursor = "IDC_SIZEWE"
                    break
                case "none":
                    cursor = ""
                    break
            }
            this.Overlay!.sendCommand({ command: "cursor", cursor })
        })
    }

    public closeAllWindows() {
        const windows = this.windows.values()
        for (const window of windows) {
            window.close()
        }
    }

    public closeWindow(name: string) {
        const window = this.windows.get(name)
        if (window) {
            window.close()
        }
    }

    public start() {
        OverlayImport.then(() => {
            this.scaleFactor = screen.getDisplayNearestPoint({
                x: 0,
                y: 0,
            }).scaleFactor
            this.startOverlay()

            // this.createOsrWindow()
            // this.createOsrStatusbarWindow()

            setInterval(() => {
                for (const window of this.Overlay.getTopWindows()) {
                    if (window.title.indexOf('LovelyPlanet') !== -1) {
                        console.log(`--------------------\n injecting ${ JSON.stringify(window) }`)
                        this.Overlay.injectProcess(window)
                    }
                }
            }, 5000)

            onIPCGameOverlayStartIntercept(() => {
                this.startIntercept()
            })

            onIPCGameOverlayStopIntercept(() => {
                this.stopIntercept()
            })
        })
    }

    public quit() {
        this.markQuit = true
        this.closeAllWindows()

        if (this.Overlay) {
            this.Overlay.stop()
        }
    }

    public startIntercept() {
        this.Overlay!.sendCommand({
            command: "input.intercept",
            intercept: true,
        })
    }

    public stopIntercept() {
        this.Overlay!.sendCommand({
            command: "input.intercept",
            intercept: false,
        })
    }

    public createWindow(
        name: string,
        option: Electron.BrowserWindowConstructorOptions,
    ) {
        const window = new BrowserWindow(option)
        this.windows.set(name, window)
        window.on("closed", () => {
            this.windows.delete(name)
        })
        window.webContents.on("new-window", (e, url) => {
            e.preventDefault()
            shell.openExternal(url)
        })

        if (global.DEBUG) {
            window.webContents.on(
                "before-input-event",
                (_: Electron.Event, input: Electron.Input) => {
                    if (input.key === "F12" && input.type === "keyDown") {
                        window.webContents.openDevTools()
                    }
                },
            )
        }

        return window
    }
}

const gameOverlay = new GameOverlay()

app.on('before-quit', () => {
    gameOverlay.quit()
})

export default gameOverlay
