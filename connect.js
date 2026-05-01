window.addMarker = async function(lat, lng) {

  const nameElement = document.getElementById('placeName');
  const mediaElement = document.getElementById('placeMedia');
  
  const name = nameElement.value || "موقع غير مسمى";
  const imageFile = mediaElement.files[0];
  let imageUrl = null;

  // رفع الصورة
  if (imageFile) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('rain-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error("خطأ في رفع الصورة:", uploadError.message);
      alert("حدث خطأ أثناء رفع الصورة");
      return;
    }

    const { data: urlData } = supabaseClient
      .storage
      .from('rain-images')
      .getPublicUrl(filePath);
      
    imageUrl = urlData.publicUrl;
  }

  // جلب بيانات الطقس
  const weather = await getHistoricalWeather(lat, lng);
  const rainAmount = weather.rainSum || 0;

  // حفظ البيانات في Supabase
  const { data: insertData, error: insertError } = await supabaseClient
    .from('rain_markers')
    .insert([
      { 
        name: name, 
        latitude: lat, 
        longitude: lng, 
        image_url: imageUrl,
        rain_amount: rainAmount
      }
    ]);

  if (insertError) {
    console.error("خطأ في حفظ البيانات:", insertError.message);
  } else {

    // 🔥 استخدام الأيقونة الملونة هنا
    const coloredIcon = getMarkerIcon(rainAmount);

    L.marker([lat, lng], { icon: coloredIcon })
      .addTo(map)
      .bindPopup(`
        <b>${name}</b><br>
        كمية المطر: ${rainAmount} ملم<br>
        ${imageUrl ? `<img src="${imageUrl}" width="150" style="margin-top:10px; border-radius:5px;">` : "لا توجد صورة"}
      `)
      .openPopup();
      
    map.closePopup();
    alert("تمت إضافة الموقع بنجاح!");
  }
};
